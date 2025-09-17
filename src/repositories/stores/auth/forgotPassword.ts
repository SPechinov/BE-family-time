import { IAuthForgotPasswordStore } from '@/domain/repositories/stores';
import { REDIS_SUCCESS_RESPONSE, RedisClient } from '@/pkg';
import { UserContactsPlainEntity } from '@/domain/entities';
import { CONFIG } from '@/config';

const ERRORS = Object.freeze({
  FAILED_TO_SAVE_FORGOT_PASSWORD_CODE: 'Failed to save forgot password code',
  INVALID_CODE_LENGTH: 'Invalid code length',
  CREDENTIALS_INVALID: 'Either email or phone must be provided',
});

export class AuthForgotPasswordStore implements IAuthForgotPasswordStore {
  readonly #redis: RedisClient;
  readonly #keyPrefix = 'auth:forgot-password';

  constructor(props: { redis: RedisClient }) {
    this.#redis = props.redis;
  }

  async saveCode(props: { userContactsPlain: UserContactsPlainEntity; code: string }) {
    this.#validateCode(props.code);
    const result = await this.#redis.setEx(this.#buildRedisKey(props), CONFIG.ttls.forgotPasswordSec, props.code);
    if (result !== REDIS_SUCCESS_RESPONSE) throw new Error(ERRORS.FAILED_TO_SAVE_FORGOT_PASSWORD_CODE);
  }

  getCode(props: { userContactsPlain: UserContactsPlainEntity }) {
    return this.#redis.get(this.#buildRedisKey(props));
  }

  deleteCode(props: { userContactsPlain: UserContactsPlainEntity }) {
    return this.#redis.del(this.#buildRedisKey(props));
  }

  #validateCode(code: string) {
    if (code.trim().length === CONFIG.codesLength.forgotPassword) return;
    throw new Error(ERRORS.INVALID_CODE_LENGTH);
  }

  #buildRedisKey(props: { userContactsPlain: UserContactsPlainEntity }): string {
    const credential = this.#extractCredentials(props);
    return `${this.#keyPrefix}:${credential}`;
  }

  #extractCredentials(props: { userContactsPlain: UserContactsPlainEntity }) {
    const credential = props.userContactsPlain.email ?? props.userContactsPlain.phone;
    if (!credential) {
      throw new Error(ERRORS.CREDENTIALS_INVALID);
    }
    return credential;
  }
}
