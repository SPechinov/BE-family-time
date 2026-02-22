import { IGroupsRepository } from '@/domains/repositories/db';
import { GroupCreateEntity, GroupEntity, GroupFindOneEntity, GroupPatchOneEntity } from '@/entities';
import { IGroupsService } from '@/domains/services';

export class GroupsService implements IGroupsService {
  #groupsRepository: IGroupsRepository;

  constructor(props: { groupsRepository: IGroupsRepository }) {
    this.#groupsRepository = props.groupsRepository;
  }

  async createOne(props: { groupCreateEntity: GroupCreateEntity }): Promise<GroupEntity> {
    return this.#groupsRepository.createOne(props.groupCreateEntity);
  }

  async findOne(props: { groupFindOneEntity: GroupFindOneEntity }): Promise<GroupEntity | null> {
    return this.#groupsRepository.findOne(props.groupFindOneEntity);
  }

  async patchOne(props: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity> {
    return this.#groupsRepository.patchOne(props);
  }
}
