import { FastifyReply, FastifyRequest } from 'fastify';
import { UserId } from '@/entities';
import { SessionData, SessionWithToken } from '../services/tokens/refreshTokensStore';

export interface ITokensService {
  generateTokens(options: { userId: UserId; request: FastifyRequest }): { access: string; refresh: string };

  setTokens(reply: FastifyReply, tokens: { access: string; refresh: string }): void;

  removeRefreshTokenFromCookie(reply: FastifyReply): void;

  getAccessToken(request: FastifyRequest): string | null;

  getRefreshToken(request: FastifyRequest): string | null;

  verifyRefreshToken(refreshToken: string): { id: UserId };

  storeSession(options: { userId: UserId; refreshToken: string; userAgent: string }): Promise<void>;

  getSession(options: { userId: UserId; refreshToken: string }): Promise<SessionData | null>;

  deleteSession(options: { userId: UserId; refreshToken: string }): Promise<void>;

  deleteAllSessions(options: { userId: UserId }): Promise<void>;

  getAllSessions(options: { userId: UserId; currentRefreshToken?: string }): Promise<SessionWithToken[]>;

  setAccessTokenInBlackList(accessToken: string): void;

  hasAccessTokenInBlackList(accessToken: string): boolean;

  isTokenRecentlyDeleted(options: { userId: UserId; refreshToken: string }): Promise<boolean>;

  invalidateAllSessionsAndBlacklist(options: { userId: UserId; accessToken?: string }): Promise<void>;
}
