import jwt, { SignOptions } from 'jsonwebtoken';
import { CONFIG } from '@/config';
import { IJwtService } from '@/domain/services';

export class JwtService implements IJwtService {
  #accessTokenSecret: string;
  #refreshTokenSecret: string;
  #accessTokenExpiry: string;
  #refreshTokenExpiry: string;

  constructor() {
    this.#accessTokenSecret = CONFIG.jwt.accessTokenSecret;
    this.#refreshTokenSecret = CONFIG.jwt.refreshTokenSecret;
    this.#accessTokenExpiry = CONFIG.jwt.accessTokenExpiry;
    this.#refreshTokenExpiry = CONFIG.jwt.refreshTokenExpiry;
  }

  generateAccessToken(payload: { userId: string }) {
    return jwt.sign(payload, this.#accessTokenSecret, {
      expiresIn: this.#accessTokenExpiry as SignOptions['expiresIn'],
      issuer: CONFIG.jwt.issuer,
    });
  }

  generateRefreshToken(payload: { userId: string }) {
    return jwt.sign(payload, this.#refreshTokenSecret, {
      expiresIn: this.#refreshTokenExpiry as SignOptions['expiresIn'],
      issuer: CONFIG.jwt.issuer,
    });
  }

  verifyAccessToken(token: string) {
    try {
      return jwt.verify(token, this.#accessTokenSecret) as { userId: string };
    } catch (error) {
      return null;
    }
  }

  verifyRefreshToken(token: string) {
    try {
      return jwt.verify(token, this.#refreshTokenSecret) as { userId: string };
    } catch (error) {
      return null;
    }
  }
}
