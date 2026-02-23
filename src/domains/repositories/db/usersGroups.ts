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
  countAllByUserId(userId: UUID): Promise<number>;
  findAllByGroupId(groupId: UUID): Promise<UsersGroupsEntity[]>;
  deleteOne(usersGroupsDeleteEntity: UsersGroupsDeleteEntity): Promise<void>;
}
