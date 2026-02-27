import {
  UserCreatePlainEntity,
  UserFindOnePlainEntity,
  UserEntity,
  UserPatchOnePlainEntity,
  UserPlainEntity,
  UserId,
} from '@/entities';
import { ILogger } from '@/pkg/logger';
import { PoolClient } from 'pg';

export interface IUsersService {
  createOne(
    userCreatePlainEntity: UserCreatePlainEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<UserEntity>;
  findOne(
    userFindOnePlainEntity: UserFindOnePlainEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<UserEntity | null>;
  findOneByUserIdOrThrow(userId: UserId, options?: { client?: PoolClient; logger?: ILogger }): Promise<UserEntity>;
  patchOne(
    props: {
      userFindOnePlainEntity: UserFindOnePlainEntity;
      userPatchOnePlainEntity: UserPatchOnePlainEntity;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<UserEntity>;
  decryptUser(userEntity: UserEntity): Promise<UserPlainEntity>;
  verifyPassword(props: { password: string; hash: string }, options?: { logger?: ILogger }): Promise<boolean>;
}
