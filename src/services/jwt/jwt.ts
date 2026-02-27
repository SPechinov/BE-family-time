import jwt from 'jsonwebtoken';
import { CONFIG } from '@/config';
import { IJwtService } from '@/domains/services';
import { UUID } from 'node:crypto';
import { UserId } from '@/entities';

export class JwtService implements IJwtService {
  #accessTokenSecret = CONFIG.jwt.accessTokenSecret;
  #refreshTokenSecret = CONFIG.jwt.refreshTokenSecret;
  #accessTokenExpiry = CONFIG.jwt.accessTokenExpiry;
  #refreshTokenExpiry = CONFIG.jwt.refreshTokenExpiry;

  generateAccessToken(payload: { userId: UUID }) {
    return jwt.sign(
      {
        createdAt: new Date().toISOString(),
        ...payload,
      },
      this.#accessTokenSecret,
      {
        expiresIn: this.#accessTokenExpiry / 1000,
        issuer: CONFIG.jwt.issuer,
      },
    );
  }

  generateRefreshToken(payload: { userId: UUID }) {
    return jwt.sign(
      {
        createdAt: new Date().toISOString(),
        ...payload,
      },
      this.#refreshTokenSecret,
      {
        expiresIn: this.#refreshTokenExpiry / 1000,
        issuer: CONFIG.jwt.issuer,
      },
    );
  }

  verifyAccessToken(token: string) {
    return this.#verifyToken(token, this.#accessTokenSecret);
  }

  verifyRefreshToken(token: string) {
    return this.#verifyToken(token, this.#refreshTokenSecret);
  }

  parseToken(token: string) {
    try {
      return jwt.decode(token);
    } catch {
      return null;
    }
  }

  #verifyToken(token: string, secret: string) {
    try {
      return jwt.verify(token, secret) as { userId: UserId };
    } catch {
      return null;
    }
  }
}
