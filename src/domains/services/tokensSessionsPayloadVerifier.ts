import {
  SessionAccessTokenMeta,
  SessionAccessTokenPayload,
  SessionAccessTokenVerificationPayload,
  SessionRefreshTokenPayload,
} from '@/entities';

export interface ITokensSessionsPayloadVerifier {
  verifyRefreshToken(token: string): SessionRefreshTokenPayload | null;
  verifyRefreshTokenOrThrow(token: string): SessionRefreshTokenPayload;
  verifyAccessToken(token: string): SessionAccessTokenVerificationPayload | null;
  verifyAccessTokenOrThrow(token: string): SessionAccessTokenPayload;
  toSessionAccessTokenMeta(payload: SessionAccessTokenVerificationPayload): SessionAccessTokenMeta;
}
