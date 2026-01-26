import { IHashPasswordService } from '@/domains/services';
import crypto from 'crypto';

const HASH_ALGORITHM = 'sha512';
const ITERATIONS = 600000;
const KEY_LENGTH = 64;
const SALT_LENGTH = 32;

export class HashPasswordService implements IHashPasswordService {
  async hashPassword(passwordPlain: string): Promise<string> {
    const salt = crypto.randomBytes(SALT_LENGTH);

    return new Promise((resolve, reject) => {
      crypto.pbkdf2(passwordPlain, salt, ITERATIONS, KEY_LENGTH, HASH_ALGORITHM, (error, hash) => {
        if (error) {
          reject(error);
          return;
        }
        console.log('asdasdasd');
        resolve(`${salt.toString('hex')}:${hash.toString('hex')}`);
      });
    });
  }

  async verifyPassword(passwordPlain: string, passwordHashed: string): Promise<boolean> {
    try {
      const [saltHex, hashHex] = passwordHashed.split(':');

      if (!saltHex || !hashHex) {
        return false;
      }

      const salt = Buffer.from(saltHex, 'hex');
      const originalHash = Buffer.from(hashHex, 'hex');

      return new Promise((resolve, reject) => {
        crypto.pbkdf2(passwordPlain, salt, ITERATIONS, KEY_LENGTH, HASH_ALGORITHM, (error, hash) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(crypto.timingSafeEqual(originalHash, hash));
        });
      });
    } catch {
      return false;
    }
  }
}
