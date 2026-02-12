import { IHmacService } from '@/domains/services';
import crypto from 'crypto';

const ALGORITHM = 'sha512';

export class HmacService implements IHmacService {
  readonly #salt: string;

  constructor(props: { salt: string }) {
    this.#validateSaltOrThrow(props.salt);
    this.#salt = props.salt;
  }

  hash(value: string): string {
    this.#validateValueOrThrow(value);
    return crypto.createHmac(ALGORITHM, this.#salt).update(value).digest('hex');
  }

  #validateSaltOrThrow(salt: string) {
    if (typeof salt !== 'string') {
      throw new Error('Salt must be a string');
    }

    if (salt.length < 16) {
      throw new Error('Salt must be at least 16 chars');
    }
  }

  #validateValueOrThrow(value: string) {
    if (typeof value !== 'string') {
      throw new Error('Value must be a string');
    }

    if (value.length < 1) {
      throw new Error('Value must be at least 1 char');
    }
  }
}
