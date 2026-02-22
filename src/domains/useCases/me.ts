import { UserPlainEntity } from '@/entities';
import { DefaultProps } from './types';
import { UUID } from 'node:crypto';

export interface IMeUseCases {
  getMe(props: DefaultProps<{ userId: UUID }>): Promise<UserPlainEntity>;
}
