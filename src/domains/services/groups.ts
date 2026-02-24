import {
  GroupCreateEntity,
  GroupEntity,
  GroupFindManyEntity,
  GroupFindOneEntity,
  GroupPatchOneEntity,
} from '@/entities';
import { PoolClient } from 'pg';

export interface IGroupsService {
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
