import { IHashService, IHashServiceConfig } from '@/domain/services';
import crypto from 'crypto';

export class HashService implements IHashService {
  hash(value: string, config: IHashServiceConfig): string {
    return crypto.createHmac('sha256', config.salt).update(value).digest('hex');
  }
}
