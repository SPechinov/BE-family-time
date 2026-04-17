import { SessionTokenPayload, UserId } from '@/entities';

export interface ITokensSessionsGenerator {
  generateTokens(props: { userId: UserId; userAgent: string }): {
    accessToken: string;
    refreshToken: string;
    accessTokenPayload: SessionTokenPayload;
    refreshTokenPayload: SessionTokenPayload;
  };
}
