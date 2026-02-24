import {
  GroupsUsersEntity,
  GroupsUsersCreateEntity,
  GroupsUsersFindOneEntity,
  GroupsUsersFindManyEntity,
  GroupsUsersDeleteOneEntity,
} from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg/logger';
import { UUID } from 'node:crypto';

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
  findUserGroups(userId: UUID, options?: { client?: PoolClient; logger?: ILogger }): Promise<GroupsUsersEntity[]>;
  findGroupUsers(groupId: UUID, options?: { client?: PoolClient; logger?: ILogger }): Promise<GroupsUsersEntity[]>;
  findGroupOwners(groupId: UUID, options?: { client?: PoolClient; logger?: ILogger }): Promise<GroupsUsersEntity[]>;
}
