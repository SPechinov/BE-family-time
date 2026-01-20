import crypto from 'crypto';
import { CONFIG } from '@/config';
import { ICryptoService } from '@/domains/services';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

export class CryptoService implements ICryptoService {
  encrypt(text: string): string {
    const key = this.deriveKey(CONFIG.salts.cryptoCredentials);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, tagHex, encrypted] = encryptedText.split(':');

    if (!ivHex || !tagHex || !encrypted) {
      throw new Error('Invalid encrypted format');
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
    return crypto.scryptSync(key, CONFIG.salts.keyDerivation, KEY_LENGTH);
  }
}
