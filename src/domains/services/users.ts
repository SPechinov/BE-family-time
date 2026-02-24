import {
  UserCreatePlainEntity,
  UserFindOnePlainEntity,
  UserEntity,
  UserPatchOnePlainEntity,
  UserPlainEntity,
} from '@/entities';
import { ILogger } from '@/pkg/logger';
import { PoolClient } from 'pg';
import { UUID } from 'node:crypto';

export interface IUsersService {
  createOne(
    userCreatePlainEntity: UserCreatePlainEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<UserEntity>;
  findOne(
    userFindOnePlainEntity: UserFindOnePlainEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<UserEntity | null>;
  findOneByUserIdOrThrow(userId: UUID, options?: { client?: PoolClient; logger?: ILogger }): Promise<UserEntity>;
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
