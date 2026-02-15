import { IRateLimiterService } from '@/domains/services';
import { ErrorTooManyRequests, RedisClient } from '@/pkg';

const KEY = 'rate-limit';

interface KeyInfo {
  attempts: number;
  lastTime: number;
}

interface Props {
  redis: RedisClient;
  maxAttempts: number;
  window: number;
  prefix: string;
  onceInInterval?: number;
}

export class RateLimiterService implements IRateLimiterService {
  readonly #redis: RedisClient;
  readonly #maxAttempts: number;
  readonly #window: number;
  readonly #onceInInterval?: number;
  readonly #prefix: string;

  constructor(props: Props) {
    this.#validatePropsOrThrow(props);
    this.#redis = props.redis;
    this.#maxAttempts = props.maxAttempts;
    this.#window = this.#normalizeTime(props.window);
    this.#prefix = props.prefix;
    this.#onceInInterval = this.#normalizeTime(props.onceInInterval);
  }

  async checkLimitOrThrow(props: { key: string }): Promise<void> {
    const redisKey = this.#buildRedisKey(props.key);
    const keyInfo = await this.#getKeyInfo(redisKey);

    if (keyInfo) {
      this.#checkAttemptsInInterval(keyInfo.attempts);
      this.#checkOnceInInterval(keyInfo.lastTime);
    }

    await this.#redis
      .multi()
      .hIncrBy(redisKey, 'attempts', 1)
      .hSet(redisKey, 'lastTime', this.#normalizeTime(Date.now()))
      .expire(redisKey, this.#window || 0)
      .exec();
  }

  async #getKeyInfo(redisKey: string): Promise<KeyInfo | null> {
    const [attemptsStr, lastTimeStr] = await this.#redis.hmGet(redisKey, ['attempts', 'lastTime']);
    if (!attemptsStr || !lastTimeStr) {
      return null;
    }

    return {
      attempts: parseInt(attemptsStr, 10),
      lastTime: parseInt(lastTimeStr, 10),
    };
  }

  #checkAttemptsInInterval(currentAttempts: KeyInfo['attempts']) {
    if (currentAttempts && currentAttempts >= this.#maxAttempts) {
      throw new ErrorTooManyRequests();
    }
  }

  #checkOnceInInterval(lastTime: KeyInfo['lastTime']) {
    if (this.#onceInInterval && lastTime && this.#normalizeTime(Date.now()) - lastTime <= this.#onceInInterval) {
      throw new ErrorTooManyRequests();
    }
  }

  #buildRedisKey(key: string): string {
    return `${KEY}:${this.#prefix}:${key}`;
  }

  #normalizeTime<T extends number | undefined>(time: T): T | number {
    if (typeof time === 'number') {
      return Math.floor(time / 1000);
    }
    return time;
  }

  #validatePropsOrThrow(props: Props) {
    if (!props) {
      throw new Error('Props object is required');
    }

    if (!props.redis) {
      throw new Error('Redis client is required');
    }

    if (typeof props.maxAttempts !== 'number') {
      throw new Error('maxAttempts must be a number');
    }

    if (typeof props.window !== 'number') {
      throw new Error('window must be a number');
    }

    if (typeof props.prefix !== 'string') {
      throw new Error('prefix must be a string');
    }

    if (props.maxAttempts < 1) {
      throw new Error('"maxAttempts" should be greater than 0');
    }

    if (props.window < 1) {
      throw new Error('"window" should be greater than 0');
    }

    if (!props.prefix) {
      throw new Error('prefix cannot be empty');
    }

    if (props.onceInInterval !== undefined) {
      if (typeof props.onceInInterval !== 'number') {
        throw new Error('onceInInterval must be a number if provided');
      }

      if (props.onceInInterval < 1) {
        throw new Error('"onceInInterval" should be greater than 0');
      }

      if (props.onceInInterval > props.window) {
        throw new Error('"onceInInterval" should be smaller than "window"');
      }
    }
  }
}
