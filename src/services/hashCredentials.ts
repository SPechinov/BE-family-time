import crypto from 'crypto';
import { IHashCredentialsService } from '@/domain/services';
import { CONFIG } from '@/config';

const HASH_ALGORITHM = 'sha512';

export class HashCredentialsService implements IHashCredentialsService {
  hashEmail(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    return crypto
      .createHmac(HASH_ALGORITHM, CONFIG.salts.hashCredentials)
      .update(normalizedEmail)
      .digest('hex');
  }

  hashPhone(phone: string) {
    const normalizedPhone = phone.replace(/\D/g, '');
    return crypto
      .createHmac(HASH_ALGORITHM, CONFIG.salts.hashCredentials)
      .update(normalizedPhone)
      .digest('hex');
  }
}
