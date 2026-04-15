import { SessionId, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface IRefreshTokensUseCase {
  execute(
    props: DefaultProps<{
      userId: UserId;
      refreshJti: string;
      userAgent: string;
      newSession: {
        userId: UserId;
        sessionId: SessionId;
        refreshJti: string;
        refreshExpiresAt: number;
        accessJti: string;
        accessExpiresAt: number;
      };
      currentAccessToken?: {
        jti: string;
        expiresAt: number;
      };
    }>,
  ): Promise<void>;
}
