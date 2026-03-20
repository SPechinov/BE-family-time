import { UserPlainEntity, UserId, UserPatchOnePlainEntity } from '@/entities';
import { DefaultProps } from './types';

export interface IMeUseCases {
  getMe(props: DefaultProps<{ userId: UserId }>): Promise<UserPlainEntity>;
  patch(
    props: DefaultProps<{ userId: UserId; userPatchOnePlainEntity: UserPatchOnePlainEntity }>,
  ): Promise<UserPlainEntity>;
}
