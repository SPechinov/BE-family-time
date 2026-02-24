import {
  GroupsUsersEntity,
  GroupsUsersCreateEntity,
  GroupsUsersFindOneEntity,
  GroupsUsersFindManyEntity,
  GroupsUsersDeleteOneEntity,
} from '@/entities';
import { PoolClient } from 'pg';
import { UUID } from 'node:crypto';

export interface IGroupsUsersService {
  createOne(
    groupsUsersCreateEntity: GroupsUsersCreateEntity,
    options?: { client?: PoolClient },
  ): Promise<GroupsUsersEntity>;
  findOne(
    groupsUsersFindOneEntity: GroupsUsersFindOneEntity,
    options?: { client?: PoolClient },
  ): Promise<GroupsUsersEntity | null>;
  findMany(
    groupsUsersFindManyEntity: GroupsUsersFindManyEntity,
    options?: { client?: PoolClient },
  ): Promise<GroupsUsersEntity[]>;
  count(groupsUsersFindManyEntity: GroupsUsersFindManyEntity, options?: { client?: PoolClient }): Promise<number>;
  deleteOne(groupsUsersDeleteOneEntity: GroupsUsersDeleteOneEntity, options?: { client?: PoolClient }): Promise<void>;
  findUserGroups(userId: UUID, options?: { client?: PoolClient }): Promise<GroupsUsersEntity[]>;
  findGroupUsers(groupId: UUID, options?: { client?: PoolClient }): Promise<GroupsUsersEntity[]>;
  findGroupOwners(groupId: UUID, options?: { client?: PoolClient }): Promise<GroupsUsersEntity[]>;
}
