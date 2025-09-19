import { ErrorTooManyRequests, RedisClient } from '@/pkg';
import { IRateLimiterService } from '@/domain/services';

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

  async checkLimit(props: { key: string }): Promise<void> {
    const currentCount = await this.#redis.get(`${KEY}:${this.#prefix}:${props.key}`);

    if (currentCount && parseInt(currentCount) >= this.#maxAttempts) throw new ErrorTooManyRequests();

    await this.#redis.incr(`${KEY}:${props.key}`);
    await this.#redis.expire(`${KEY}:${props.key}`, this.#windowSec);
  }
}
