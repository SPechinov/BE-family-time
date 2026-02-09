import crypto from 'crypto';
import { CONFIG } from '@/config';
import { ICryptoService } from '@/domains/services';
import { LRUCache } from 'lru-cache';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

const derivedKeyCache = new LRUCache<string, Buffer>({ max: 1_000_000, ttl: 1000 * 60 * 60 * 24 * 7 });

export class CryptoService implements ICryptoService {
  #password = Buffer.from(CONFIG.salts.cryptoCredentials);

  async encrypt(text: string, salt: string): Promise<string> {
    this.#validateSaltOrThrow(salt);
    const key = await this.#deriveKey(salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  }

  async decrypt(encryptedText: string, salt: string): Promise<string> {
    this.#validateSaltOrThrow(salt);
    this.#validateEncryptedTextOrThrow(encryptedText);

    const [ivHex, tagHex, encrypted] = encryptedText.split(':');

    if (!ivHex || !tagHex || !encrypted) {
      throw new Error('Invalid encrypted format');
    }

    const key = await this.#deriveKey(salt);
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async #deriveKey(salt: string): Promise<Buffer> {
    const cachedKey = derivedKeyCache.get(salt);
    if (cachedKey) return cachedKey;

    return new Promise((resolve, reject) => {
      crypto.scrypt(this.#password, salt, KEY_LENGTH, (error, key) => {
        if (error) {
          reject(error);
          return;
        }
        derivedKeyCache.set(salt, Buffer.from(key));
        resolve(key);
      });
    });
  }

  #validateSaltOrThrow(salt: string) {
    if (salt.length < 8) {
      throw new Error('Invalid salt');
    }
  }

  #validateEncryptedTextOrThrow(encryptedText: string) {
    if (encryptedText.split(':').length !== 3) {
      throw new Error('Invalid encrypted format');
    }
  }
}
