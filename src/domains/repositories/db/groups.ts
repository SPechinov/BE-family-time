import {
  GroupCreateEntity,
  GroupFindManyEntity,
  GroupFindOneEntity,
  GroupEntity,
  GroupPatchOneEntity,
} from '@/entities';
import { PoolClient } from 'pg';
import { IBaseRepository } from './baseRepository';

export interface IGroupsRepository extends IBaseRepository {
  createOne(groupCreateEntity: GroupCreateEntity, options?: { client?: PoolClient }): Promise<GroupEntity>;
  findOne(groupFindOneEntity: GroupFindOneEntity): Promise<GroupEntity | null>;
  findMany(groupFindManyEntity?: GroupFindManyEntity): Promise<GroupEntity[]>;
  patchOne(props: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity>;
  deleteOne(groupFindOneEntity: GroupFindOneEntity): Promise<void>;
}
