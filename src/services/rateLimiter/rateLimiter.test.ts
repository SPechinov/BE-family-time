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
    const keys = await redisClient.keys('rate-limiter:test:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  });

  describe('checkLimitOrThrow', () => {
    it('should allow requests within limit', async () => {
      const rateLimiter = new RateLimiterService(redisClient, {
        points: 5,
        duration: 60,
        blockDuration: 0,
        keyPrefix: 'test',
      });

      const key = 'user-1';

      for (let i = 0; i < 5; i++) {
        await expect(rateLimiter.checkLimitOrThrow({ key })).resolves.not.toThrow();
      }
    });

    it('should throw ErrorTooManyRequests when limit exceeded', async () => {
      const rateLimiter = new RateLimiterService(redisClient, {
        points: 2,
        duration: 60,
        blockDuration: 0,
        keyPrefix: 'test',
      });

      const key = 'user-2';

      await rateLimiter.checkLimitOrThrow({ key });
      await rateLimiter.checkLimitOrThrow({ key });

      await expect(rateLimiter.checkLimitOrThrow({ key })).rejects.toThrow(ErrorTooManyRequests);
    });

    it('should include msBeforeNext and remainingPoints in error', async () => {
      const rateLimiter = new RateLimiterService(redisClient, {
        points: 1,
        duration: 60,
        blockDuration: 0,
        keyPrefix: 'test',
      });

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

    it('should track limits per unique key', async () => {
      const rateLimiter = new RateLimiterService(redisClient, {
        points: 1,
        duration: 60,
        blockDuration: 0,
        keyPrefix: 'test',
      });

      const key1 = 'user-5a';
      const key2 = 'user-5b';

      await rateLimiter.checkLimitOrThrow({ key: key1 });
      await expect(rateLimiter.checkLimitOrThrow({ key: key1 })).rejects.toThrow(ErrorTooManyRequests);

      await expect(rateLimiter.checkLimitOrThrow({ key: key2 })).resolves.not.toThrow();
    });

    it('should respect blockDuration when limit exceeded', async () => {
      const rateLimiter = new RateLimiterService(redisClient, {
        points: 1,
        duration: 60,
        blockDuration: 5,
        keyPrefix: 'test',
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
  });
});
