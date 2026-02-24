import {
  GroupsUsersEntity,
  GroupsUsersCreateEntity,
  GroupsUsersFindOneEntity,
  GroupsUsersDeleteOneEntity,
  GroupsUsersFindManyEntity,
} from '@/entities';
import { PoolClient } from 'pg';
import { IBaseRepository } from './baseRepository';

export interface IGroupsUsersRepository extends IBaseRepository {
  createOne(
    groupsUsersCreateEntity: GroupsUsersCreateEntity,
    options?: { client?: PoolClient },
  ): Promise<GroupsUsersEntity>;
  findOne(
    groupsUsersFindOneEntity: GroupsUsersFindOneEntity,
    options?: { client?: PoolClient },
  ): Promise<GroupsUsersEntity | null>;
  findMany(options: GroupsUsersFindManyEntity, client?: { client?: PoolClient }): Promise<GroupsUsersEntity[]>;
  count(options: GroupsUsersFindManyEntity, client?: { client?: PoolClient }): Promise<number>;
  deleteOne(groupsUsersDeleteOneEntity: GroupsUsersDeleteOneEntity, options?: { client?: PoolClient }): Promise<void>;
}
