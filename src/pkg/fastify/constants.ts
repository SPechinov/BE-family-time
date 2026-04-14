import { CONFIG } from '@/config';
import { FastifyCookieOptions } from '@fastify/cookie';
import { FastifyJWTOptions } from '@fastify/jwt';
import { FastifyRequest } from 'fastify';

export const CookieConfig: FastifyCookieOptions = Object.freeze({
  secret: CONFIG.cookie.secret,
} as const);

export const JwtConfig: FastifyJWTOptions = Object.freeze({
  secret: CONFIG.jwt.secret,
  sign: { expiresIn: CONFIG.jwt.access.expiry / 1000, iss: CONFIG.jwt.issuer, algorithm: 'HS256' },
  verify: {
    extractToken: (request: FastifyRequest) => {
      return request.cookies?.[CONFIG.jwt.access.cookieName];
    },
  },
} as const);
