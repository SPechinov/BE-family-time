import {
  GroupCreateEntity,
  GroupEntity,
  GroupFindManyEntity,
  GroupFindOneEntity,
  GroupPatchOneEntity,
} from '@/entities';

export interface IGroupsService {
  createOne(groupCreateEntity: GroupCreateEntity): Promise<GroupEntity>;
  findOne(groupFindOneEntity: GroupFindOneEntity): Promise<GroupEntity | null>;
  findMany(groupFindManyEntity?: GroupFindManyEntity): Promise<GroupEntity[]>;
  patchOne(props: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity>;
  deleteOne(groupFindOneEntity: GroupFindOneEntity): Promise<void>;
}
