import { UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface ILogoutSessionUseCase {
  execute(
    props: DefaultProps<{
      userId: UserId;
      refreshJti: string;
      currentAccessToken?: {
        jti: string;
        expiresAt: number;
      };
    }>,
  ): Promise<void>;
}
