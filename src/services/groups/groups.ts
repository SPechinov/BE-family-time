import { IGroupsRepository, IUsersGroupsRepository } from '@/domains/repositories/db';
import {
  GroupCreateEntity,
  GroupEntity,
  GroupFindOneEntity,
  GroupPatchOneEntity,
  UsersGroupsCreateEntity,
  UsersGroupsFindManyEntity,
} from '@/entities';
import { IGroupsService } from '@/domains/services';
import { UUID } from 'node:crypto';

export class GroupsService implements IGroupsService {
  #groupsRepository: IGroupsRepository;
  #usersGroupsRepository: IUsersGroupsRepository;

  constructor(props: { groupsRepository: IGroupsRepository; usersGroupsRepository: IUsersGroupsRepository }) {
    this.#groupsRepository = props.groupsRepository;
    this.#usersGroupsRepository = props.usersGroupsRepository;
  }

  async createOne(props: { groupCreateEntity: GroupCreateEntity; userId: UUID }): Promise<GroupEntity> {
    return this.#groupsRepository.withTransaction(async (client) => {
      const group = await this.#groupsRepository.createOne(props.groupCreateEntity, { client });

      await this.#usersGroupsRepository.createOne(
        new UsersGroupsCreateEntity({
          userId: props.userId,
          groupId: group.id,
          isOwner: true,
        }),
        { client },
      );

      return group;
    });
  }

  async findOne(props: { groupFindOneEntity: GroupFindOneEntity }): Promise<GroupEntity | null> {
    return this.#groupsRepository.findOne(props.groupFindOneEntity);
  }

  async findMany(props: { usersGroupsFindManyOptions: UsersGroupsFindManyEntity }): Promise<GroupEntity[]> {
    const usersGroups = await this.#usersGroupsRepository.findMany(props.usersGroupsFindManyOptions);

    const groups: GroupEntity[] = [];

    for (const userGroup of usersGroups) {
      const group = await this.#groupsRepository.findOne(new GroupFindOneEntity({ id: userGroup.groupId }));
      if (!group) continue;
      groups.push(group);
    }
    return groups;
  }

  async patchOne(props: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity> {
    return this.#groupsRepository.patchOne(props);
  }

  async getGroupsCount(props: { usersGroupsFindManyEntity: UsersGroupsFindManyEntity }): Promise<number> {
    return await this.#usersGroupsRepository.count(new UsersGroupsFindManyEntity(props.usersGroupsFindManyEntity));
  }
}
