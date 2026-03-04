import { FastifyReply, FastifyRequest } from 'fastify';
import { UserId } from '@/entities';

export interface ITokenService {
  generateTokens(options: { userId: UserId; request: FastifyRequest }): { access: string; refresh: string };

  setTokens(reply: FastifyReply, tokens: { access: string; refresh: string }): void;

  removeRefreshTokenFromCookie(reply: FastifyReply): void;

  getRefreshToken(request: FastifyRequest): string | null;

  verifyRefreshToken(refreshToken: string): { id: UserId };
}
