import {
  UserCreatePlainEntity,
  UserFindOnePlainEntity,
  UserEntity,
  UserPatchOnePlainEntity,
  UserPlainEntity,
} from '@/entities';
import { ILogger } from '@/pkg';
import { UUID } from 'node:crypto';

export interface IUsersService {
  createOne(props: { userCreatePlainEntity: UserCreatePlainEntity }): Promise<UserEntity>;
  findOne(props: { userFindOnePlainEntity: UserFindOnePlainEntity }): Promise<UserEntity | null>;
  findOneByUserIdOrThrow(userId: UUID): Promise<UserEntity>;
  patchOne(props: {
    userFindOnePlainEntity: UserFindOnePlainEntity;
    userPatchOnePlainEntity: UserPatchOnePlainEntity;
  }): Promise<UserEntity>;
  decryptUser(userEntity: UserEntity): Promise<UserPlainEntity>;
  verifyPassword(props: { password: string; hash: string; logger: ILogger }): Promise<boolean>;
}
