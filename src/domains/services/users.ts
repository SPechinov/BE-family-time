import { UserCreatePlainEntity, UserEntity, UserFindOnePlainEntity, UserPatchOnePlainEntity } from '@/entities';

export interface IUsersService {
  createOne(props: { userCreatePlainEntity: UserCreatePlainEntity }): Promise<UserEntity>;
  findOne(props: { userFindOnePlainEntity: UserFindOnePlainEntity }): Promise<UserEntity | null>;
  patchOne(props: {
    userFindOnePlainEntity: UserFindOnePlainEntity;
    userPatchOnePlainEntity: UserPatchOnePlainEntity;
  }): Promise<UserEntity>;
}
