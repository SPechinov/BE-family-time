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
  findOne(groupFindOneEntity: GroupFindOneEntity, options?: { client?: PoolClient }): Promise<GroupEntity | null>;
  findMany(groupFindManyEntity?: GroupFindManyEntity, options?: { client?: PoolClient }): Promise<GroupEntity[]>;
  patchOne(
    props: {
      groupFindOneEntity: GroupFindOneEntity;
      groupPatchOneEntity: GroupPatchOneEntity;
    },
    options?: { client?: PoolClient },
  ): Promise<GroupEntity>;
  deleteOne(groupFindOneEntity: GroupFindOneEntity, options?: { client?: PoolClient }): Promise<void>;
}
