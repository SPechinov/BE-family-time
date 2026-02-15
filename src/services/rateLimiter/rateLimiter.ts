import { IRateLimiterService } from '@/domains/services';
import { ErrorTooManyRequests, RedisClient } from '@/pkg';

const KEY = 'rate-limit';

interface KeyInfo {
  attempts: number | null;
  lastTime: number | null;
}

export class RateLimiterService implements IRateLimiterService {
  readonly #redis: RedisClient;
  readonly #maxAttempts?: number;
  readonly #window?: number;
  readonly #onceInInterval?: number;
  readonly #prefix: string;

  constructor(props: {
    redis: RedisClient;
    maxAttempts?: number;
    window?: number;
    prefix: string;
    onceInInterval?: number;
  }) {
    this.#redis = props.redis;
    this.#maxAttempts = props.maxAttempts;
    this.#window = props.window ? props.window / 1000 : undefined;
    this.#prefix = props.prefix;
    this.#onceInInterval = props.onceInInterval ? props.onceInInterval / 1000 : props.onceInInterval;
  }

  async checkLimitOrThrow(props: { key: string }): Promise<void> {
    const redisKey = this.#buildRedisKey(props.key);
    const { attempts, lastTime } = await this.#getKeyInfo(redisKey);

    this.#checkAttemptsInInterval(attempts);
    this.#checkOnceInInterval(lastTime);

    await this.#redis
      .multi()
      .hIncrBy(redisKey, 'attempts', 1)
      .hSet(redisKey, 'lastTime', Math.floor(Date.now() / 1000))
      .expire(redisKey, this.#window || this.#onceInInterval || 0)
      .exec();
  }

  async #getKeyInfo(redisKey: string): Promise<KeyInfo> {
    const [attemptsStr, lastTimeStr] = await this.#redis.hmGet(redisKey, ['attempts', 'lastTime']);

    return {
      attempts: attemptsStr ? parseInt(attemptsStr, 10) : null,
      lastTime: lastTimeStr ? parseInt(lastTimeStr, 10) : null,
    };
  }

  #checkAttemptsInInterval(currentAttempts: KeyInfo['attempts']) {
    if (this.#maxAttempts && this.#window && currentAttempts && currentAttempts >= this.#maxAttempts) {
      throw new ErrorTooManyRequests();
    }
  }

  #checkOnceInInterval(lastTime: KeyInfo['lastTime']) {
    if (this.#onceInInterval && lastTime && Date.now() / 1000 - lastTime <= this.#onceInInterval) {
      throw new ErrorTooManyRequests();
    }
  }

  #buildRedisKey(key: string): string {
    return `${KEY}:${this.#prefix}:${key}`;
  }
}
