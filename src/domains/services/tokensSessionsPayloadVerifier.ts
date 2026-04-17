import { SessionTokenMeta, SessionTokenPayload } from '@/entities';

export interface ITokensSessionsPayloadVerifier {
  verifyRefreshToken(token: string): SessionTokenPayload | null;
  verifyRefreshTokenOrThrow(token: string): SessionTokenPayload;
  verifyAccessToken(token: string): SessionTokenPayload | null;
  verifyAccessTokenOrThrow(token: string): SessionTokenPayload;
  toSessionAccessTokenMeta(payload: SessionTokenPayload): SessionTokenMeta;
}
