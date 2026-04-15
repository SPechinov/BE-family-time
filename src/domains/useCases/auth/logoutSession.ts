import { SessionAccessTokenMeta, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface ILogoutSessionUseCase {
  execute(
    props: DefaultProps<{
      userId: UserId;
      refreshJti: string;
      currentAccessToken?: SessionAccessTokenMeta;
    }>,
  ): Promise<void>;
}
