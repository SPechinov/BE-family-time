import { UserId, UserPatchOnePlainEntity, UserPlainEntity } from '@/entities';
import { DefaultProps } from '../types';

export interface IPatchMeProfileUseCase {
  execute(
    props: DefaultProps<{ userId: UserId; userPatchOnePlainEntity: UserPatchOnePlainEntity }>,
  ): Promise<UserPlainEntity>;
}
