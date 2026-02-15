import { IOtpCodesService } from '@/domains/services';
import { REDIS_STATUS_SUCCESS_RESPONSE, RedisClient } from '@/pkg';

type RedisKey = `otp:${string}:${string}`;

export class OtpCodesService implements IOtpCodesService {
  readonly #redis: RedisClient;
  readonly #prefix: string;
  readonly #codeLength: number;
  readonly #ttlSec: number;

  constructor(props: { redis: RedisClient; prefix: string; codeLength: number; ttlSec: number }) {
    this.#redis = props.redis;
    this.#prefix = props.prefix;
    this.#codeLength = props.codeLength;
    this.#ttlSec = props.ttlSec;
  }

  async saveCode(props: { code: string; key: string }) {
    this.#validateCodeOrThrow(props.code);
    this.#validateKeyOrThrow(props.key);
    const result = await this.#redis.setEx(this.#buildRedisKey(props), this.#ttlSec, props.code);
    if (result !== REDIS_STATUS_SUCCESS_RESPONSE) throw new Error('Failed to save code');
  }

  getCode(props: { key: string }) {
    this.#validateKeyOrThrow(props.key);
    return this.#redis.get(this.#buildRedisKey(props));
  }

  deleteCode(props: { key: string }) {
    this.#validateKeyOrThrow(props.key);
    return this.#redis.del(this.#buildRedisKey(props));
  }

  #validateCodeOrThrow(code: string) {
    if (typeof code !== 'string') throw new Error('Code must be a string');
    if (code.length !== this.#codeLength) throw new Error('Invalid code length');
  }

  #validateKeyOrThrow(key: string) {
    if (typeof key !== 'string') throw new Error('Key must be a string');
    if (key.length < 1) throw new Error('Invalid key length');
  }

  #buildRedisKey(props: { key: string }): RedisKey {
    return `otp:${this.#prefix}:${props.key}`;
  }
}
