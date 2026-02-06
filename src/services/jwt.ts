import jwt from 'jsonwebtoken';
import { CONFIG } from '@/config';
import { IJwtService } from '@/domains/services';

export class JwtService implements IJwtService {
  #accessTokenSecret = CONFIG.jwt.accessTokenSecret;
  #refreshTokenSecret = CONFIG.jwt.refreshTokenSecret;
  #accessTokenExpiry = CONFIG.jwt.accessTokenExpiry;
  #refreshTokenExpiry = CONFIG.jwt.refreshTokenExpiry;

  generateAccessToken(payload: { userId: string }) {
    return jwt.sign(payload, this.#accessTokenSecret, {
      expiresIn: this.#accessTokenExpiry,
      issuer: CONFIG.jwt.issuer,
    });
  }

  generateRefreshToken(payload: { userId: string }) {
    return jwt.sign(payload, this.#refreshTokenSecret, {
      expiresIn: this.#refreshTokenExpiry,
      issuer: CONFIG.jwt.issuer,
    });
  }

  verifyAccessToken(token: string) {
    try {
      return jwt.verify(token, this.#accessTokenSecret) as { userId: string };
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string) {
    try {
      return jwt.verify(token, this.#refreshTokenSecret) as { userId: string };
    } catch {
      return null;
    }
  }
}
