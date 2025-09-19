import { REDIS_SUCCESS_RESPONSE, RedisClient } from '@/pkg';
import { IOtpCodesStore } from '@/domain/repositories/stores';

const ERRORS = Object.freeze({
  FAILED_TO_SAVE_CODE: 'Failed to save code',
  INVALID_CODE_LENGTH: 'Invalid code length',
});

export class OtpCodesStore implements IOtpCodesStore {
  readonly #redis: RedisClient;
  readonly #keyPrefix: string;
  readonly #codeLength: number;
  readonly #ttlSec: number;

  constructor(props: { redis: RedisClient; keyPrefix: string; codeLength: number; ttlSec: number }) {
    this.#redis = props.redis;
    this.#keyPrefix = props.keyPrefix;
    this.#codeLength = props.codeLength;
    this.#ttlSec = props.ttlSec;
  }

  async saveCode(props: { code: string; credential: string }) {
    this.#validateCode(props.code);
    const result = await this.#redis.setEx(this.#buildRedisKey(props), this.#ttlSec, props.code);
    if (result !== REDIS_SUCCESS_RESPONSE) throw new Error(ERRORS.FAILED_TO_SAVE_CODE);
  }

  getCode(props: { credential: string }) {
    return this.#redis.get(this.#buildRedisKey(props));
  }

  deleteCode(props: { credential: string }) {
    return this.#redis.del(this.#buildRedisKey(props));
  }

  #validateCode(code: string) {
    if (code.length === this.#codeLength) return;
    throw new Error(ERRORS.INVALID_CODE_LENGTH);
  }

  #buildRedisKey(props: { credential: string }): string {
    return `${this.#keyPrefix}:${props.credential}`;
  }
}
