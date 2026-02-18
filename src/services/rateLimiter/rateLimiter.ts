import { RateLimiterRedis } from 'rate-limiter-flexible';
import { IRateLimiterService } from '@/domains/services';
import { RedisClient } from '@/pkg';
import { ErrorTooManyRequests } from '@/pkg/errors';

export interface IRateLimiterServiceOptions {
  points: number;
  duration: number;
  blockDuration?: number;
  keyPrefix: string;
}

export class RateLimiterService implements IRateLimiterService {
  readonly #rateLimiter: RateLimiterRedis;

  constructor(redisClient: RedisClient, options: IRateLimiterServiceOptions) {
    this.#rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      useRedisPackage: true,
      points: options.points ?? 50,
      duration: options.duration ?? 3600,
      blockDuration: options.blockDuration ?? 0,
      keyPrefix: `rate-limiter-${options.keyPrefix}`,
    });
  }

  async checkLimitOrThrow(props: { key: string }): Promise<void> {
    try {
      await this.#rateLimiter.consume(props.key);
    } catch (rejRes) {
      if (rejRes instanceof Error) {
        throw rejRes;
      }
      const error = rejRes as { msBeforeNext: number; remainingPoints: number };
      throw new ErrorTooManyRequests({
        msBeforeNext: error.msBeforeNext,
        remainingPoints: error.remainingPoints,
      });
    }
  }
}
