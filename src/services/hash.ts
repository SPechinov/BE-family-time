import { IHashService } from '@/domains/services';
import crypto from 'crypto';

const ALGORITHM = 'sha512';

export class HashService implements IHashService {
  readonly #salt: string;

  constructor(props: { salt: string }) {
    this.#salt = props.salt;
  }

  hash(value: string): string {
    return crypto.createHmac(ALGORITHM, this.#salt).update(value).digest('hex');
  }
}
