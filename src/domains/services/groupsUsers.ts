import {
  GroupsUsersEntity,
  GroupsUsersCreateEntity,
  GroupsUsersFindOneEntity,
  GroupsUsersFindManyEntity,
  GroupsUsersDeleteOneEntity,
  UserId,
  GroupId,
} from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg/logger';

export interface IGroupsUsersService {
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
  findUserGroups(userId: UserId, options?: { client?: PoolClient; logger?: ILogger }): Promise<GroupsUsersEntity[]>;
  findGroupUsers(groupId: GroupId, options?: { client?: PoolClient; logger?: ILogger }): Promise<GroupsUsersEntity[]>;
  findGroupOwners(groupId: GroupId, options?: { client?: PoolClient; logger?: ILogger }): Promise<GroupsUsersEntity[]>;
}
