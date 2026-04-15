import { UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface ILogoutAllSessionsUseCase {
  execute(
    props: DefaultProps<{
      userId: UserId;
      refreshJti: string;
    }>,
  ): Promise<void>;
}
