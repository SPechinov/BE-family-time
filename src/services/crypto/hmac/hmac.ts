import { IHmacService } from '@/domains/services';
import crypto from 'crypto';

const ALGORITHM = 'sha512';

export class HmacService implements IHmacService {
  readonly #salt: string;

  constructor(props: { salt: string }) {
    this.#salt = props.salt;
  }

  hash(value: string): string {
    return crypto.createHmac(ALGORITHM, this.#salt).update(value).digest('hex');
  }
}
