import { IGroupsRepository } from '@/domains/repositories/db';
import { GroupCreateEntity, GroupEntity, GroupFindOneEntity, GroupPatchOneEntity } from '@/entities';
import { IGroupsService } from '@/domains/services';

export class GroupsService implements IGroupsService {
  readonly #groupsRepository: IGroupsRepository;

  constructor(props: { groupsRepository: IGroupsRepository }) {
    this.#groupsRepository = props.groupsRepository;
  }

  async createOne(groupCreateEntity: GroupCreateEntity): Promise<GroupEntity> {
    return this.#groupsRepository.createOne(groupCreateEntity);
  }

  async findOne(groupFindOneEntity: GroupFindOneEntity): Promise<GroupEntity | null> {
    return this.#groupsRepository.findOne(groupFindOneEntity);
  }

  async patchOne(props: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity> {
    return this.#groupsRepository.patchOne(props);
  }
}
