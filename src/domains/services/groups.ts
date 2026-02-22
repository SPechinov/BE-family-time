import { GroupCreateEntity, GroupEntity, GroupFindOneEntity, GroupPatchOneEntity } from '@/entities';

export interface IGroupsService {
  createOne(props: { groupCreateEntity: GroupCreateEntity }): Promise<GroupEntity>;
  findOne(props: { groupFindOneEntity: GroupFindOneEntity }): Promise<GroupEntity | null>;
  patchOne(props: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity>;
}
