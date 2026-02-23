import {
  GroupCreateEntity,
  GroupEntity,
  GroupFindOneEntity,
  GroupPatchOneEntity,
  UsersGroupsFindManyEntity,
} from '@/entities';
import { UUID } from 'node:crypto';

export interface IGroupsService {
  createOne(props: { groupCreateEntity: GroupCreateEntity; userId: UUID }): Promise<GroupEntity>;
  findOne(props: { groupFindOneEntity: GroupFindOneEntity }): Promise<GroupEntity | null>;
  findMany(props: { usersGroupsFindManyOptions: UsersGroupsFindManyEntity }): Promise<GroupEntity[]>;
  patchOne(props: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity>;
  getGroupsCount(props: { usersGroupsFindManyEntity: UsersGroupsFindManyEntity }): Promise<number>;
}
