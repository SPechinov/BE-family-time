import { IGroupsRepository } from '@/domains/repositories/db';
import { GroupCreateEntity, GroupEntity, GroupFindOneEntity, GroupPatchOneEntity } from '@/entities';
import { ErrorGroupNotExists } from '@/pkg';
import { IGroupsService } from '@/domains/services';

export class GroupsService implements IGroupsService {
  #groupsRepository: IGroupsRepository;

  constructor(props: { groupsRepository: IGroupsRepository }) {
    this.#groupsRepository = props.groupsRepository;
  }

  async createOne(props: { groupCreateEntity: GroupCreateEntity }): Promise<GroupEntity> {
    return this.#groupsRepository.createOne(props.groupCreateEntity);
  }

  async findOne(props: { groupFindOneEntity: GroupFindOneEntity }): Promise<GroupEntity> {
    const group = await this.#groupsRepository.findOne(props.groupFindOneEntity);
    if (!group) {
      throw new ErrorGroupNotExists();
    }

    return group;
  }

  async patchOne(props: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity> {
    return this.#groupsRepository.patchOne(props);
  }
}
