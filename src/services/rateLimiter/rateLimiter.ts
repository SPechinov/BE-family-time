import { IRateLimiterService } from '@/domains/services';
import { ErrorTooManyRequests, RedisClient } from '@/pkg';

const KEY = 'rate-limit';

export class RateLimiterService implements IRateLimiterService {
  readonly #redis: RedisClient;
  readonly #maxAttempts: number;
  readonly #windowSec: number;
  readonly #prefix: string;

  constructor(props: { redis: RedisClient; maxAttempts: number; windowSec: number; prefix: string }) {
    this.#redis = props.redis;
    this.#maxAttempts = props.maxAttempts;
    this.#windowSec = props.windowSec;
    this.#prefix = props.prefix;
  }

  async checkLimitOrThrow(props: { key: string }): Promise<void> {
    const redisKey = this.#buildRedisKey(props.key);
    const currentCount = await this.#redis.get(redisKey);

    if (currentCount && parseInt(currentCount) >= this.#maxAttempts) throw new ErrorTooManyRequests();

    await this.#redis.incr(redisKey);
    await this.#redis.expire(redisKey, this.#windowSec);
  }

  #buildRedisKey(key: string): string {
    return `${KEY}:${this.#prefix}:${key}`;
  }
}
