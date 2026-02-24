import { UserCreateEntity, UserFindOneEntity, UserEntity, UserPatchOneEntity } from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg/logger';

export interface IUsersRepository {
  createOne(
    userCreateEntity: UserCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<UserEntity>;
  findOne(
    userFindEntity: UserFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<UserEntity | null>;
  patchOne(
    props: {
      userFindOneEntity: UserFindOneEntity;
      userPatchOneEntity: UserPatchOneEntity;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<UserEntity>;
}
