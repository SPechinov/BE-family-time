import {
  GroupsUsersEntity,
  GroupsUsersCreateEntity,
  GroupsUsersFindOneEntity,
  GroupsUsersFindManyEntity,
  GroupsUsersDeleteOneEntity,
} from '@/entities';
import { UUID } from 'node:crypto';

export interface IGroupsUsersService {
  createOne(groupsUsersCreateEntity: GroupsUsersCreateEntity): Promise<GroupsUsersEntity>;
  findOne(groupsUsersFindOneEntity: GroupsUsersFindOneEntity): Promise<GroupsUsersEntity | null>;
  findMany(groupsUsersFindManyEntity: GroupsUsersFindManyEntity): Promise<GroupsUsersEntity[]>;
  count(groupsUsersFindManyEntity: GroupsUsersFindManyEntity): Promise<number>;
  deleteOne(groupsUsersDeleteOneEntity: GroupsUsersDeleteOneEntity): Promise<void>;
  findUserGroups(userId: UUID): Promise<GroupsUsersEntity[]>;
  findGroupUsers(groupId: UUID): Promise<GroupsUsersEntity[]>;
  findGroupOwners(groupId: UUID): Promise<GroupsUsersEntity[]>;
}
