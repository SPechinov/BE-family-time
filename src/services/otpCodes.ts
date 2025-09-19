import { REDIS_SUCCESS_RESPONSE, RedisClient } from '@/pkg';
import { IOtpCodesService } from '@/domain/services';

const ERRORS = Object.freeze({
  FAILED_TO_SAVE_CODE: 'Failed to save code',
  INVALID_CODE_LENGTH: 'Invalid code length',
});

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
    this.#validateCode(props.code);
    const result = await this.#redis.setEx(this.#buildRedisKey(props), this.#ttlSec, props.code);
    if (result !== REDIS_SUCCESS_RESPONSE) throw new Error(ERRORS.FAILED_TO_SAVE_CODE);
  }

  getCode(props: { key: string }) {
    return this.#redis.get(this.#buildRedisKey(props));
  }

  deleteCode(props: { key: string }) {
    return this.#redis.del(this.#buildRedisKey(props));
  }

  #validateCode(code: string) {
    if (code.length === this.#codeLength) return;
    throw new Error(ERRORS.INVALID_CODE_LENGTH);
  }

  #buildRedisKey(props: { key: string }): string {
    return `otp:${this.#prefix}:${props.key}`;
  }
}
