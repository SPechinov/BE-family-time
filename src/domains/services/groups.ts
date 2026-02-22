import { GroupCreateEntity, GroupEntity, GroupFindOneEntity, GroupPatchOneEntity } from '@/entities';
import { UUID } from 'node:crypto';

export interface IGroupsService {
  createOne(props: { groupCreateEntity: GroupCreateEntity; userId: UUID }): Promise<GroupEntity>;
  findOne(props: { groupFindOneEntity: GroupFindOneEntity }): Promise<GroupEntity | null>;
  patchOne(props: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity>;
  getUserGroupsCount(props: { userId: UUID }): Promise<number>;
}
