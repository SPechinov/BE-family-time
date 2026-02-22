import { GroupCreateEntity, GroupFindOneEntity, GroupEntity, GroupPatchOneEntity } from '@/entities';

export interface IGroupsRepository {
  createOne(groupCreateEntity: GroupCreateEntity): Promise<GroupEntity>;
  findOne(groupFindOneEntity: GroupFindOneEntity): Promise<GroupEntity | null>;
  patchOne(props: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity>;
}
