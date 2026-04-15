import { SessionId, UserId } from '@/entities';

export interface ITokensSessionsPayloadVerifier {
  verifyRefreshToken(token: string): { userId: UserId; sid: SessionId; jti: string; exp?: number } | null;
  verifyRefreshTokenOrThrow(token: string): { userId: UserId; sid: SessionId; jti: string; exp?: number };
  verifyAccessToken(token: string): { jti: string; exp: number } | null;
  verifyAccessTokenOrThrow(token: string): { userId: UserId; sid: SessionId; jti: string; exp: number };
}
