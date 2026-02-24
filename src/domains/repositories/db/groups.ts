import {
  GroupCreateEntity,
  GroupFindManyEntity,
  GroupFindOneEntity,
  GroupEntity,
  GroupPatchOneEntity,
} from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg/logger';

export interface IGroupsRepository {
  createOne(
    groupCreateEntity: GroupCreateEntity,
    options: { client?: PoolClient; logger: ILogger },
  ): Promise<GroupEntity>;
  findOne(
    groupFindOneEntity: GroupFindOneEntity,
    options: { client?: PoolClient; logger: ILogger },
  ): Promise<GroupEntity | null>;
  findMany(
    groupFindManyEntity: GroupFindManyEntity,
    options: { client?: PoolClient; logger: ILogger },
  ): Promise<GroupEntity[]>;
  patchOne(
    props: {
      groupFindOneEntity: GroupFindOneEntity;
      groupPatchOneEntity: GroupPatchOneEntity;
    },
    options: { client?: PoolClient; logger: ILogger },
  ): Promise<GroupEntity>;
  deleteOne(groupFindOneEntity: GroupFindOneEntity, options: { client?: PoolClient; logger: ILogger }): Promise<void>;
}
