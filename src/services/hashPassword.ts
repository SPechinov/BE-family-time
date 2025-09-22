import crypto from 'crypto';
import { IHashPasswordService } from '@/domain/services';

const HASH_ALGORITHM = 'sha512';
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const SALT_LENGTH = 32;

export class HashPasswordService implements IHashPasswordService {
  hashPassword(passwordPlain: string): string {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const hash = crypto.pbkdf2Sync(
      passwordPlain,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      HASH_ALGORITHM
    );

    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  verifyPassword(passwordPlain: string, passwordHashed: string): boolean {
    try {
      const [saltHex, hashHex] = passwordHashed.split(':');

      if (!saltHex || !hashHex) {
        return false;
      }

      const salt = Buffer.from(saltHex, 'hex');
      const originalHash = Buffer.from(hashHex, 'hex');

      const hash = crypto.pbkdf2Sync(
        passwordPlain,
        salt,
        ITERATIONS,
        KEY_LENGTH,
        HASH_ALGORITHM
      );

      return crypto.timingSafeEqual(originalHash, hash);
    } catch {
      return false;
    }
  }
}