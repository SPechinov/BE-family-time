import { RateLimiterService } from '@/services/rateLimiter/rateLimiter';
import { ErrorTooManyRequests } from '@/pkg/errors';
import { createClient } from 'redis';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const createRateLimiter = (
  redisClient: ReturnType<typeof createClient>,
  options: {
    points?: number;
    duration?: number;
    blockDuration?: number;
    keyPrefix?: string;
  },
) => {
  return new RateLimiterService(redisClient, {
    points: options.points ?? 5,
    duration: options.duration ?? 60,
    blockDuration: options.blockDuration ?? 0,
    keyPrefix: options.keyPrefix ?? 'test',
  });
};

const cleanupKeys = async (redisClient: ReturnType<typeof createClient>, pattern: string) => {
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('RateLimiterService', () => {
  const redisClient = createClient({ url: 'redis://localhost:6379' });
  const keyPattern = 'rate-limiter:test:*';

  beforeAll(async () => {
    await redisClient.connect();
  });

  afterAll(async () => {
    await redisClient.disconnect();
  });

  beforeEach(async () => {
    await cleanupKeys(redisClient, keyPattern);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // checkLimitOrThrow()
  // ───────────────────────────────────────────────────────────────────────────

  describe('checkLimitOrThrow()', () => {
    describe('✓ Valid operations', () => {
      it('should allow requests within limit', async () => {
        const rateLimiter = createRateLimiter(redisClient, { points: 5, duration: 60, keyPrefix: 'test' });
        const key = 'user-1';

        for (let i = 0; i < 5; i++) {
          await expect(rateLimiter.checkLimitOrThrow({ key })).resolves.not.toThrow();
        }
      });

      it('should allow all requests when limit is high', async () => {
        const rateLimiter = createRateLimiter(redisClient, { points: 100, duration: 60, keyPrefix: 'test' });
        const key = 'user-high-limit';

        for (let i = 0; i < 50; i++) {
          await expect(rateLimiter.checkLimitOrThrow({ key })).resolves.not.toThrow();
        }
      });

      it('should handle single request with limit 1', async () => {
        const rateLimiter = createRateLimiter(redisClient, { points: 1, duration: 60, keyPrefix: 'test' });
        const key = 'user-single';

        await expect(rateLimiter.checkLimitOrThrow({ key })).resolves.not.toThrow();
      });
    });

    describe('✗ Limit exceeded', () => {
      it('should throw ErrorTooManyRequests when limit exceeded', async () => {
        const rateLimiter = createRateLimiter(redisClient, { points: 2, duration: 60, keyPrefix: 'test' });
        const key = 'user-2';

        await rateLimiter.checkLimitOrThrow({ key });
        await rateLimiter.checkLimitOrThrow({ key });

        await expect(rateLimiter.checkLimitOrThrow({ key })).rejects.toThrow(ErrorTooManyRequests);
      });

      it('should throw ErrorTooManyRequests with correct properties', async () => {
        const rateLimiter = createRateLimiter(redisClient, { points: 1, duration: 60, keyPrefix: 'test' });
        const key = 'user-3';

        await rateLimiter.checkLimitOrThrow({ key });

        try {
          await rateLimiter.checkLimitOrThrow({ key });
          fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorTooManyRequests);
          expect((error as ErrorTooManyRequests).msBeforeNext).toBeGreaterThan(0);
          expect((error as ErrorTooManyRequests).remainingPoints).toBe(0);
        }
      });

      it('should continue throwing after multiple limit violations', async () => {
        const rateLimiter = createRateLimiter(redisClient, { points: 1, duration: 60, keyPrefix: 'test' });
        const key = 'user-multi-violation';

        await rateLimiter.checkLimitOrThrow({ key });

        for (let i = 0; i < 5; i++) {
          await expect(rateLimiter.checkLimitOrThrow({ key })).rejects.toThrow(ErrorTooManyRequests);
        }
      });
    });

    describe('🔑 Key isolation', () => {
      it('should track limits per unique key', async () => {
        const rateLimiter = createRateLimiter(redisClient, { points: 1, duration: 60, keyPrefix: 'test' });

        const key1 = 'user-5a';
        const key2 = 'user-5b';

        await rateLimiter.checkLimitOrThrow({ key: key1 });
        await expect(rateLimiter.checkLimitOrThrow({ key: key1 })).rejects.toThrow(ErrorTooManyRequests);

        await expect(rateLimiter.checkLimitOrThrow({ key: key2 })).resolves.not.toThrow();
      });

      it('should handle many different keys independently', async () => {
        const rateLimiter = createRateLimiter(redisClient, { points: 2, duration: 60, keyPrefix: 'test' });

        const keys = ['user-a', 'user-b', 'user-c', 'user-d', 'user-e'];

        for (const key of keys) {
          await rateLimiter.checkLimitOrThrow({ key });
          await rateLimiter.checkLimitOrThrow({ key });

          await expect(rateLimiter.checkLimitOrThrow({ key })).rejects.toThrow(ErrorTooManyRequests);
        }
      });

      it('should handle keys with special characters', async () => {
        const rateLimiter = createRateLimiter(redisClient, { points: 1, duration: 60, keyPrefix: 'test' });

        const specialKeys = [
          'user@example.com',
          'user+tag@example.com',
          'user:session:123',
          'ip:192.168.1.1',
          'uuid:550e8400-e29b-41d4-a716-446655440000',
        ];

        for (const key of specialKeys) {
          await expect(rateLimiter.checkLimitOrThrow({ key })).resolves.not.toThrow();
        }
      });

      it('should handle keys with unicode characters', async () => {
        const rateLimiter = createRateLimiter(redisClient, { points: 1, duration: 60, keyPrefix: 'test' });

        const unicodeKeys = ['пользователь@пример.рф', '用户@例子。广告', 'user🔐@example.com'];

        for (const key of unicodeKeys) {
          await expect(rateLimiter.checkLimitOrThrow({ key })).resolves.not.toThrow();
        }
      });
    });

    describe('⏱️ Time-based behavior', () => {
      it('should reset limit after duration expires', async () => {
        const rateLimiter = createRateLimiter(redisClient, {
          points: 1,
          duration: 1, // 1 second
          keyPrefix: 'test-time',
        });

        const key = 'user-time-reset';

        // Use up the limit
        await rateLimiter.checkLimitOrThrow({ key });
        await expect(rateLimiter.checkLimitOrThrow({ key })).rejects.toThrow(ErrorTooManyRequests);

        // Wait for duration to expire
        await new Promise((resolve) => setTimeout(resolve, 1100));

        // Should be allowed again
        await expect(rateLimiter.checkLimitOrThrow({ key })).resolves.not.toThrow();
      }, 3000);

      it('should respect blockDuration when limit exceeded', async () => {
        const rateLimiter = createRateLimiter(redisClient, {
          points: 1,
          duration: 60,
          blockDuration: 2, // 2 seconds block
          keyPrefix: 'test-block',
        });

        const key = 'user-6';

        await rateLimiter.checkLimitOrThrow({ key });

        try {
          await rateLimiter.checkLimitOrThrow({ key });
          fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorTooManyRequests);
          expect((error as ErrorTooManyRequests).msBeforeNext).toBeGreaterThan(0);
        }
      });

      it('should remain blocked during blockDuration even after duration expires', async () => {
        const rateLimiter = createRateLimiter(redisClient, {
          points: 1,
          duration: 1, // 1 second duration
          blockDuration: 3, // 3 seconds block (longer than duration)
          keyPrefix: 'test-block-long',
        });

        const key = 'user-block-long';

        // Use up the limit and get blocked
        await rateLimiter.checkLimitOrThrow({ key });
        await expect(rateLimiter.checkLimitOrThrow({ key })).rejects.toThrow(ErrorTooManyRequests);

        // Wait for duration to expire (but block is still active)
        await new Promise((resolve) => setTimeout(resolve, 1100));

        // Should still be blocked because blockDuration > duration
        await expect(rateLimiter.checkLimitOrThrow({ key })).rejects.toThrow(ErrorTooManyRequests);
      }, 5000);
    });

    describe('⚡ Performance', () => {
      it('should handle many sequential requests quickly', async () => {
        const rateLimiter = createRateLimiter(redisClient, {
          points: 100,
          duration: 60,
          keyPrefix: 'test-perf',
        });

        const key = 'user-perf';
        const startTime = Date.now();

        for (let i = 0; i < 50; i++) {
          await rateLimiter.checkLimitOrThrow({ key });
        }

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(1000);
      }, 2000);

      it('should handle parallel requests', async () => {
        const rateLimiter = createRateLimiter(redisClient, {
          points: 100,
          duration: 60,
          keyPrefix: 'test-parallel',
        });

        const key = 'user-parallel';
        const promises = Array(20)
          .fill(null)
          .map(() => rateLimiter.checkLimitOrThrow({ key }));

        await expect(Promise.all(promises)).resolves.not.toThrow();
      });

      it('should handle multiple keys in parallel', async () => {
        const rateLimiter = createRateLimiter(redisClient, {
          points: 10,
          duration: 60,
          keyPrefix: 'test-multi-parallel',
        });

        const keys = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
        const promises = keys.flatMap((key) =>
          Array(3)
            .fill(null)
            .map(() => rateLimiter.checkLimitOrThrow({ key })),
        );

        await expect(Promise.all(promises)).resolves.not.toThrow();
      });
    });

    describe('🔐 Security & Edge cases', () => {
      it('should handle empty string key', async () => {
        const rateLimiter = createRateLimiter(redisClient, { points: 10, duration: 60, keyPrefix: 'sec-empty' });

        await expect(rateLimiter.checkLimitOrThrow({ key: '' })).resolves.not.toThrow();
      });

      it('should handle very long key', async () => {
        const rateLimiter = createRateLimiter(redisClient, { points: 10, duration: 60, keyPrefix: 'sec-long' });
        const longKey = 'a'.repeat(1000);

        await expect(rateLimiter.checkLimitOrThrow({ key: longKey })).resolves.not.toThrow();
      });

      it('should handle numeric string key', async () => {
        const rateLimiter = createRateLimiter(redisClient, { points: 10, duration: 60, keyPrefix: 'sec-numeric' });

        await expect(rateLimiter.checkLimitOrThrow({ key: '123456789' })).resolves.not.toThrow();
      });

      it('should handle case-sensitive keys', async () => {
        const rateLimiter = createRateLimiter(redisClient, { points: 1, duration: 60, keyPrefix: 'sec-case' });

        await rateLimiter.checkLimitOrThrow({ key: 'User' });
        await expect(rateLimiter.checkLimitOrThrow({ key: 'User' })).rejects.toThrow(ErrorTooManyRequests);

        // Different case should have separate limit
        await expect(rateLimiter.checkLimitOrThrow({ key: 'user' })).resolves.not.toThrow();
        await expect(rateLimiter.checkLimitOrThrow({ key: 'USER' })).resolves.not.toThrow();
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Integration tests
  // ───────────────────────────────────────────────────────────────────────────

  describe('Integration', () => {
    it('should work with different prefixes', async () => {
      const authLimiter = createRateLimiter(redisClient, {
        points: 3,
        duration: 60,
        keyPrefix: 'integration-auth',
      });

      const apiLimiter = createRateLimiter(redisClient, {
        points: 10,
        duration: 60,
        keyPrefix: 'integration-api',
      });

      const key = 'user-integration';

      // Auth limiter
      await authLimiter.checkLimitOrThrow({ key });
      await authLimiter.checkLimitOrThrow({ key });
      await authLimiter.checkLimitOrThrow({ key });
      await expect(authLimiter.checkLimitOrThrow({ key })).rejects.toThrow(ErrorTooManyRequests);

      // API limiter should still work (different prefix)
      await expect(apiLimiter.checkLimitOrThrow({ key })).resolves.not.toThrow();
    });

    it('should handle realistic login scenario', async () => {
      const loginLimiter = createRateLimiter(redisClient, {
        points: 5,
        duration: 60,
        blockDuration: 300, // 5 minutes block
        keyPrefix: 'integ-login',
      });

      const userKey = 'login:user@example.com';

      // Simulate 5 login attempts
      for (let i = 0; i < 5; i++) {
        await expect(loginLimiter.checkLimitOrThrow({ key: userKey })).resolves.not.toThrow();
      }

      // 6th attempt should fail
      await expect(loginLimiter.checkLimitOrThrow({ key: userKey })).rejects.toThrow(ErrorTooManyRequests);

      // Different user should have separate limit
      await expect(loginLimiter.checkLimitOrThrow({ key: 'login:other@example.com' })).resolves.not.toThrow();
    });

    it('should handle realistic API rate limiting', async () => {
      const apiLimiter = createRateLimiter(redisClient, {
        points: 100,
        duration: 60,
        keyPrefix: 'integ-api-rate',
      });

      const apiKey = 'api-key-12345';

      // Simulate API calls
      for (let i = 0; i < 50; i++) {
        await expect(apiLimiter.checkLimitOrThrow({ key: apiKey })).resolves.not.toThrow();
      }

      // Should still have remaining
      for (let i = 0; i < 50; i++) {
        await expect(apiLimiter.checkLimitOrThrow({ key: apiKey })).resolves.not.toThrow();
      }
    });

    it('should clean up expired keys', async () => {
      const rateLimiter = createRateLimiter(redisClient, {
        points: 1,
        duration: 1, // 1 second
        keyPrefix: 'integration-cleanup',
      });

      const key = 'user-cleanup';

      // Use up the limit
      await rateLimiter.checkLimitOrThrow({ key });

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Key should be cleaned up by Redis TTL
      const keys = await redisClient.keys('rate-limiter:integration-cleanup:*');
      expect(keys.length).toBe(0);
    }, 3000);
  });
});
