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
  findOne(groupsUsersFindOneEntity: GroupsUsersFindOneEntity): Promise<GroupsUsersEntity | null>;
  findMany(options: GroupsUsersFindManyEntity): Promise<GroupsUsersEntity[]>;
  count(options: GroupsUsersFindManyEntity): Promise<number>;
  deleteOne(groupsUsersDeleteOneEntity: GroupsUsersDeleteOneEntity): Promise<void>;
}
