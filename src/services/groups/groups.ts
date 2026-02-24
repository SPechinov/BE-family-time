import { IGroupsRepository } from '@/domains/repositories/db';
import {
  GroupCreateEntity,
  GroupEntity,
  GroupFindManyEntity,
  GroupFindOneEntity,
  GroupPatchOneEntity,
} from '@/entities';
import { IGroupsService } from '@/domains/services';
import { PoolClient } from 'pg';

export class GroupsService implements IGroupsService {
  readonly #groupsRepository: IGroupsRepository;

  constructor(props: { groupsRepository: IGroupsRepository }) {
    this.#groupsRepository = props.groupsRepository;
  }

  async createOne(groupCreateEntity: GroupCreateEntity, options?: { client?: PoolClient }): Promise<GroupEntity> {
    return this.#groupsRepository.createOne(groupCreateEntity, options);
  }

  async findOne(
    groupFindOneEntity: GroupFindOneEntity,
    options?: { client?: PoolClient },
  ): Promise<GroupEntity | null> {
    return this.#groupsRepository.findOne(groupFindOneEntity, options);
  }

  async findMany(groupFindManyEntity?: GroupFindManyEntity, options?: { client?: PoolClient }): Promise<GroupEntity[]> {
    return this.#groupsRepository.findMany(groupFindManyEntity, options);
  }

  async patchOne(
    props: {
      groupFindOneEntity: GroupFindOneEntity;
      groupPatchOneEntity: GroupPatchOneEntity;
    },
    options?: { client?: PoolClient },
  ): Promise<GroupEntity> {
    return this.#groupsRepository.patchOne(props, options);
  }

  async deleteOne(groupFindOneEntity: GroupFindOneEntity, options?: { client?: PoolClient }): Promise<void> {
    return this.#groupsRepository.deleteOne(groupFindOneEntity, options);
  }
}
