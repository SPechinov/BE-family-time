import {
  GroupsUsersEntity,
  GroupsUsersCreateEntity,
  GroupsUsersFindOneEntity,
  GroupsUsersDeleteOneEntity,
  GroupsUsersFindManyEntity,
} from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg/logger';

export interface IGroupsUsersRepository {
  createOne(
    groupsUsersCreateEntity: GroupsUsersCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<GroupsUsersEntity>;
  findOne(
    groupsUsersFindOneEntity: GroupsUsersFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<GroupsUsersEntity | null>;
  findMany(
    groupsUsersFindManyEntity: GroupsUsersFindManyEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<GroupsUsersEntity[]>;
  count(
    groupsUsersFindManyEntity: GroupsUsersFindManyEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<number>;
  deleteOne(
    groupsUsersDeleteOneEntity: GroupsUsersDeleteOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void>;
}
