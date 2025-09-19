import { RedisClient } from '@/pkg';
import { IRateLimiter } from '@/domain/services';

export class RateLimiter implements IRateLimiter {
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

  async checkLimit(props: { key: string }): Promise<boolean> {
    const currentCount = await this.#redis.get(`rate_limit:${this.#prefix}:${props.key}`);
    if (currentCount && parseInt(currentCount) >= this.#maxAttempts) {
      return false;
    }

    await this.#redis.incr(`rate_limit:${props.key}`);
    await this.#redis.expire(`rate_limit:${props.key}`, this.#windowSec);
    return true;
  }
}
