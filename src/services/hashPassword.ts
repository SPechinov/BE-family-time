import { IHashPasswordService } from '@/domains/services';
import argon2 from 'argon2';
import { ILogger } from '@/pkg';

const OPTIONS = Object.freeze({
  type: argon2.argon2id,
  memoryCost: 32768,
  timeCost: 6,
  parallelism: 1,
  hashLength: 64,
} as const);

export class HashPasswordService implements IHashPasswordService {
  async hashPassword(passwordPlain: string): Promise<string> {
    this.#validateStringOrThrow(passwordPlain);
    return argon2.hash(passwordPlain, OPTIONS);
  }

  async verifyPassword(passwordPlain: string, passwordHashed: string, logger?: ILogger): Promise<boolean> {
    this.#validateStringOrThrow(passwordPlain);
    this.#validateStringOrThrow(passwordHashed);

    try {
      return await argon2.verify(passwordHashed, passwordPlain);
    } catch (error) {
      logger?.error({ error });
      return false;
    }
  }

  #validateStringOrThrow(password: string) {
    if (typeof password !== 'string' || password.length < 1) {
      throw new Error('Invalid password');
    }
  }
}
