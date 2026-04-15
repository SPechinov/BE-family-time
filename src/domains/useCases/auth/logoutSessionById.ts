import { SessionId, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface ILogoutSessionByIdUseCase {
  execute(
    props: DefaultProps<{
      userId: UserId;
      refreshJti: string;
      sessionId: SessionId;
      currentSessionId: SessionId;
    }>,
  ): Promise<{ isCurrentSession: boolean }>;
}
