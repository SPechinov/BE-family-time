import { UserCreatePlainEntity, UserEntity, UserFindOnePlainEntity, UserPatchOnePlainEntity } from '@/entities';
import { ILogger } from '@/pkg';

export interface IUsersService {
  createOne(props: { userCreatePlainEntity: UserCreatePlainEntity }): Promise<UserEntity>;
  findOne(props: { userFindOnePlainEntity: UserFindOnePlainEntity }): Promise<UserEntity | null>;
  patchOne(props: {
    userFindOnePlainEntity: UserFindOnePlainEntity;
    userPatchOnePlainEntity: UserPatchOnePlainEntity;
  }): Promise<UserEntity>;
  verifyPassword(props: { password: string; hash: string; logger: ILogger }): Promise<boolean>;
}
