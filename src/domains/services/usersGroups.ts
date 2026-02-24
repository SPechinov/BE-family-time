import {
  UsersGroupsEntity,
  UsersGroupsCreateEntity,
  UsersGroupsFindOneEntity,
  UsersGroupsFindManyEntity,
  UsersGroupsDeleteOneEntity,
} from '@/entities';
import { UUID } from 'node:crypto';

export interface IUsersGroupsService {
  createOne(usersGroupsCreateEntity: UsersGroupsCreateEntity): Promise<UsersGroupsEntity>;
  findOne(usersGroupsFindOneEntity: UsersGroupsFindOneEntity): Promise<UsersGroupsEntity | null>;
  findMany(usersGroupsFindManyEntity: UsersGroupsFindManyEntity): Promise<UsersGroupsEntity[]>;
  count(usersGroupsFindManyEntity: UsersGroupsFindManyEntity): Promise<number>;
  deleteOne(usersGroupsDeleteOneEntity: UsersGroupsDeleteOneEntity): Promise<void>;
  findUserGroups(userId: UUID): Promise<UsersGroupsEntity[]>;
  findGroupUsers(groupId: UUID): Promise<UsersGroupsEntity[]>;
  findGroupOwners(groupId: UUID): Promise<UsersGroupsEntity[]>;
}
