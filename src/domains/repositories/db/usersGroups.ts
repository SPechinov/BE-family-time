import {
  UsersGroupsEntity,
  UsersGroupsCreateEntity,
  UsersGroupsFindOneEntity,
  UsersGroupsDeleteEntity,
  UsersGroupsFindAllOptions,
} from '@/entities';
import { UUID } from 'node:crypto';
import { PoolClient } from 'pg';
import { IBaseRepository } from './baseRepository';

export interface IUsersGroupsRepository extends IBaseRepository {
  createOne(
    usersGroupsCreateEntity: UsersGroupsCreateEntity,
    options?: { client?: PoolClient },
  ): Promise<UsersGroupsEntity>;
  findOne(usersGroupsFindOneEntity: UsersGroupsFindOneEntity): Promise<UsersGroupsEntity | null>;
  findAll(options: UsersGroupsFindAllOptions): Promise<UsersGroupsEntity[]>;
  count(options: UsersGroupsFindAllOptions): Promise<number>;
  deleteOne(usersGroupsDeleteEntity: UsersGroupsDeleteEntity): Promise<void>;
  deleteAllByUserId(userId: UUID): Promise<void>;
  deleteAllByGroupId(groupId: UUID): Promise<void>;
}
