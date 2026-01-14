import { IHashService, IHashServiceConfig } from '@/domain/services';
import crypto from 'crypto';

const ALGORITHM = 'sha512';

export class HashService implements IHashService {
  hash(value: string, config: IHashServiceConfig): string {
    return crypto.createHmac(ALGORITHM, config.salt).update(value).digest('hex');
  }
}
