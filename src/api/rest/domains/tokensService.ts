import { FastifyReply, FastifyRequest } from 'fastify';
import { UserId } from '@/entities';
import { SessionData, SessionWithToken } from '../services/tokens/refreshTokensStore';

export interface ITokenService {
  generateTokens(options: { userId: UserId; request: FastifyRequest }): { access: string; refresh: string };

  setTokens(reply: FastifyReply, tokens: { access: string; refresh: string }): void;

  removeRefreshTokenFromCookie(reply: FastifyReply): void;

  getRefreshToken(request: FastifyRequest): string | null;

  verifyRefreshToken(refreshToken: string): { id: UserId };

  storeSession(options: { userId: UserId; refreshToken: string; userAgent: string; expiresAt?: number }): Promise<void>;

  getSession(options: { userId: UserId; refreshToken: string }): Promise<SessionData | null>;

  deleteSession(options: { userId: UserId; refreshToken: string }): Promise<void>;

  deleteAllSessions(options: { userId: UserId }): Promise<void>;

  getAllSessions(options: { userId: UserId; currentRefreshToken?: string }): Promise<SessionWithToken[]>;
}
