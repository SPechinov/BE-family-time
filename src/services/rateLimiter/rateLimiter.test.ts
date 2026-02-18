import { RateLimiterService } from './rateLimiter';
import { ErrorTooManyRequests } from '@/pkg/errors';
import { createClient } from 'redis';

describe('RateLimiterService', () => {
  const redisClient = createClient({ url: 'redis://localhost:6379' });

  beforeAll(async () => {
    await redisClient.connect();
  });

  afterAll(async () => {
    await redisClient.disconnect();
  });

  beforeEach(async () => {
    // Очищаем ключи rate limiter перед каждым тестом
    const keys = await redisClient.keys('rlflx:test:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  });

  describe('checkLimitOrThrow', () => {
    it('should allow requests within limit', async () => {
      const rateLimiter = new RateLimiterService(redisClient, {
        points: 5,
        duration: 60,
        keyPrefix: 'test',
      });

      const key = 'user-1';

      // Should not throw for first 5 requests
      for (let i = 0; i < 5; i++) {
        await expect(rateLimiter.checkLimitOrThrow({ key })).resolves.not.toThrow();
      }
    });

    it('should throw ErrorTooManyRequests when limit exceeded', async () => {
      const rateLimiter = new RateLimiterService(redisClient, {
        points: 2,
        duration: 60,
        keyPrefix: 'test',
      });

      const key = 'user-2';

      // Exhaust the limit
      await rateLimiter.checkLimitOrThrow({ key });
      await rateLimiter.checkLimitOrThrow({ key });

      // Should throw on 3rd request
      await expect(rateLimiter.checkLimitOrThrow({ key })).rejects.toThrow(ErrorTooManyRequests);
    });

    it('should include msBeforeNext and remainingPoints in error', async () => {
      const rateLimiter = new RateLimiterService(redisClient, {
        points: 1,
        duration: 60,
        keyPrefix: 'test',
      });

      const key = 'user-3';

      // Exhaust the limit
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

    it('should use default options when not provided', async () => {
      const rateLimiter = new RateLimiterService(redisClient);
      const key = 'user-4';

      // Should allow some requests with default config
      await expect(rateLimiter.checkLimitOrThrow({ key })).resolves.not.toThrow();
    });

    it('should track limits per unique key', async () => {
      const rateLimiter = new RateLimiterService(redisClient, {
        points: 1,
        duration: 60,
        keyPrefix: 'test',
      });

      const key1 = 'user-5a';
      const key2 = 'user-5b';

      // Exhaust limit for key1
      await rateLimiter.checkLimitOrThrow({ key: key1 });
      await expect(rateLimiter.checkLimitOrThrow({ key: key1 })).rejects.toThrow(ErrorTooManyRequests);

      // key2 should still have its own limit
      await expect(rateLimiter.checkLimitOrThrow({ key: key2 })).resolves.not.toThrow();
    });
  });
});
