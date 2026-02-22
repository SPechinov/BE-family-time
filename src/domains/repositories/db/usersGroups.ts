import {
  UsersGroupsEntity,
  UsersGroupsCreateEntity,
  UsersGroupsFindOneEntity,
  UsersGroupsDeleteEntity,
} from '@/entities';
import { UUID } from 'node:crypto';
import { PoolClient } from 'pg';

export interface IUsersGroupsRepository {
  createOne(
    usersGroupsCreateEntity: UsersGroupsCreateEntity,
    options?: { client?: PoolClient },
  ): Promise<UsersGroupsEntity>;
  findOne(usersGroupsFindOneEntity: UsersGroupsFindOneEntity): Promise<UsersGroupsEntity | null>;
  findAllByUserId(userId: UUID): Promise<UsersGroupsEntity[]>;
  findAllByGroupId(groupId: UUID): Promise<UsersGroupsEntity[]>;
  deleteOne(usersGroupsDeleteEntity: UsersGroupsDeleteEntity): Promise<void>;
  deleteAllByUserId(userId: UUID): Promise<void>;
  deleteAllByGroupId(groupId: UUID): Promise<void>;
}
