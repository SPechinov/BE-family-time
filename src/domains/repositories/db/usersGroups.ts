import {
  UsersGroupsEntity,
  UsersGroupsCreateEntity,
  UsersGroupsFindOneEntity,
  UsersGroupsDeleteOneEntity,
  UsersGroupsFindManyEntity,
} from '@/entities';
import { PoolClient } from 'pg';
import { IBaseRepository } from './baseRepository';

export interface IUsersGroupsRepository extends IBaseRepository {
  createOne(
    usersGroupsCreateEntity: UsersGroupsCreateEntity,
    options?: { client?: PoolClient },
  ): Promise<UsersGroupsEntity>;
  findOne(usersGroupsFindOneEntity: UsersGroupsFindOneEntity): Promise<UsersGroupsEntity | null>;
  findMany(options: UsersGroupsFindManyEntity): Promise<UsersGroupsEntity[]>;
  count(options: UsersGroupsFindManyEntity): Promise<number>;
  deleteOne(usersGroupsDeleteOneEntity: UsersGroupsDeleteOneEntity): Promise<void>;
}
