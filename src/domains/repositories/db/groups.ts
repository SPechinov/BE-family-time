import { GroupCreateEntity, GroupFindOneEntity, GroupEntity, GroupPatchOneEntity } from '@/entities';
import { PoolClient } from 'pg';
import { IBaseRepository } from './baseRepository';

export interface IGroupsRepository extends IBaseRepository {
  createOne(groupCreateEntity: GroupCreateEntity, options?: { client?: PoolClient }): Promise<GroupEntity>;
  findOne(groupFindOneEntity: GroupFindOneEntity): Promise<GroupEntity | null>;
  patchOne(props: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity>;
}
