import { SessionId, UserId, UserSessionEntity } from '@/entities';
import { DefaultProps } from '../types';

export interface IGetSessionsUseCase {
  execute(
    props: DefaultProps<{
      userId: UserId;
      refreshJti: string;
      currentSessionId: SessionId;
    }>,
  ): Promise<UserSessionEntity[]>;
}
