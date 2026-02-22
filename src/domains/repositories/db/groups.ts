import { GroupCreateEntity, GroupFindOneEntity, GroupEntity, GroupPatchOneEntity } from '@/entities';
import { PoolClient } from 'pg';

export interface IGroupsRepository {
  createOne(groupCreateEntity: GroupCreateEntity, options?: { client?: PoolClient }): Promise<GroupEntity>;
  findOne(groupFindOneEntity: GroupFindOneEntity): Promise<GroupEntity | null>;
  patchOne(props: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity>;
  withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
}
