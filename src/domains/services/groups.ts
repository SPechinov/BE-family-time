import {
  GroupCreateEntity,
  GroupEntity,
  GroupFindOneEntity,
  GroupPatchOneEntity,
  UsersGroupsEntity,
  UsersGroupsFindManyEntity,
  UsersGroupsFindOneEntity,
} from '@/entities';
import { UUID } from 'node:crypto';

export interface IGroupsService {
  createOne(props: { groupCreateEntity: GroupCreateEntity; userId: UUID }): Promise<GroupEntity>;
  findOne(props: {
    usersGroupsFindOneEntity: UsersGroupsFindOneEntity;
  }): Promise<{ group: GroupEntity; usersGroups: UsersGroupsEntity[] } | null>;
  findMany(props: {
    usersGroupsFindManyOptions: UsersGroupsFindManyEntity;
  }): Promise<{ group: GroupEntity; usersGroups: UsersGroupsEntity[] }[]>;
  patchOne(props: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity>;
  getGroupsCount(props: { usersGroupsFindManyEntity: UsersGroupsFindManyEntity }): Promise<number>;
}
