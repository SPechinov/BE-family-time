import { GroupCreateEntity, GroupEntity, GroupFindOneEntity, GroupPatchOneEntity } from '@/entities';

export interface IGroupsService {
  createOne(props: { groupCreateEntity: GroupCreateEntity }): Promise<GroupEntity>;
  findOne(props: { groupFindOneEntity: GroupFindOneEntity }): Promise<GroupEntity>;
  patchOne(props: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity>;
}
