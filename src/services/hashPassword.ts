import crypto from 'crypto';
import { IHashPasswordService } from '@/domain/services';

const HASH_ALGORITHM = 'sha512';
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const SALT_LENGTH = 32;

export class HashPasswordService implements IHashPasswordService {
  hashPassword(plainPassword: string): string {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const hash = crypto.pbkdf2Sync(
      plainPassword,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      HASH_ALGORITHM
    );

    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  verifyPassword(plainPassword: string, hashedPassword: string): boolean {
    try {
      const [saltHex, hashHex] = hashedPassword.split(':');

      if (!saltHex || !hashHex) {
        return false;
      }

      const salt = Buffer.from(saltHex, 'hex');
      const originalHash = Buffer.from(hashHex, 'hex');

      const hash = crypto.pbkdf2Sync(
        plainPassword,
        salt,
        ITERATIONS,
        KEY_LENGTH,
        HASH_ALGORITHM
      );

      // Используем timingSafeEqual для защиты от timing attacks
      return crypto.timingSafeEqual(originalHash, hash);
    } catch {
      return false;
    }
  }
}