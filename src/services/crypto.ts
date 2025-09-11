import crypto from 'crypto';
import { ICryptoService } from '@/domain/services';
import { CONFIG } from '@/config';
import { ServerError } from '@/api/rest/errors';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

export class CryptoService implements ICryptoService {
  encryptEmail(email: string): string {
    const normalizedEmail = email.toLowerCase().trim();
    return this.encrypt(normalizedEmail);
  }

  decryptEmail(encryptedEmail: string): string {
    return this.decrypt(encryptedEmail);
  }

  encryptPhone(phone: string): string {
    const normalizedPhone = phone.replace(/\D/g, '');
    return this.encrypt(normalizedPhone);
  }

  decryptPhone(encryptedPhone: string): string {
    return this.decrypt(encryptedPhone);
  }

  private encrypt(text: string): string {
    const key = this.deriveKey(CONFIG.salts.cryptoCredentials);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, tagHex, encrypted] = encryptedText.split(':');

    if (!ivHex || !tagHex || !encrypted) {
      throw new ServerError({ message: 'Invalid encrypted format' });
    }

    const key = this.deriveKey(CONFIG.salts.cryptoCredentials);
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private deriveKey(key: string): Buffer {
    return crypto.scryptSync(key, CONFIG.salts.cryptoCredentials, KEY_LENGTH);
  }
}
