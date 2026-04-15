import { FastifyReply, FastifyRequest } from 'fastify';
import { CONFIG } from '@/config';
import { ACCESS_TOKEN_COOKIE_CONFIG, REFRESH_TOKEN_COOKIE_CONFIG } from '../../constants';

export class AuthCookiesService {
  getRefreshToken(request: FastifyRequest): string | null {
    return request.cookies?.[CONFIG.jwt.refresh.cookieName] || null;
  }

  getAccessToken(request: FastifyRequest): string | null {
    return request.cookies?.[CONFIG.jwt.access.cookieName] || null;
  }

  setAccessToken(reply: FastifyReply, accessToken: string): void {
    reply.setCookie(CONFIG.jwt.access.cookieName, accessToken, ACCESS_TOKEN_COOKIE_CONFIG);
  }

  clearAccessToken(reply: FastifyReply): void {
    reply.setCookie(CONFIG.jwt.access.cookieName, '', { ...ACCESS_TOKEN_COOKIE_CONFIG, maxAge: 0 });
  }

  setRefreshToken(reply: FastifyReply, refreshToken: string): void {
    reply.setCookie(CONFIG.jwt.refresh.cookieName, refreshToken, REFRESH_TOKEN_COOKIE_CONFIG);
  }

  clearRefreshToken(reply: FastifyReply): void {
    reply.setCookie(CONFIG.jwt.refresh.cookieName, '', { ...REFRESH_TOKEN_COOKIE_CONFIG, maxAge: 0 });
  }
}
