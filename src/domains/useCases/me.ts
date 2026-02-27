import { UserPlainEntity, UserId } from '@/entities';
import { DefaultProps } from './types';

export interface IMeUseCases {
  getMe(props: DefaultProps<{ userId: UserId }>): Promise<UserPlainEntity>;
}
