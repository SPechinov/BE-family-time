import { IGroupsRepository, IUsersGroupsRepository } from '@/domains/repositories/db';
import {
  GroupCreateEntity,
  GroupEntity,
  GroupFindOneEntity,
  GroupPatchOneEntity,
  GroupUser,
  GroupWithUsersEntity,
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

  async findMany(props: { usersGroupsFindManyOptions: UsersGroupsFindManyEntity }): Promise<GroupWithUsersEntity[]> {
    const usersGroups = await this.#usersGroupsRepository.findMany(props.usersGroupsFindManyOptions);

    const groupsWithUsers: GroupWithUsersEntity[] = [];

    for (const userGroup of usersGroups) {
      const group = await this.#groupsRepository.findOne(new GroupFindOneEntity({ id: userGroup.groupId }));

      if (!group) continue;

      groupsWithUsers.push(
        new GroupWithUsersEntity({
          id: group.id,
          name: group.name,
          description: group.description,
          createdAt: group.createdAt,
          deleted: group.deleted,
          deletedAt: group.deletedAt,
          users: [new GroupUser({ id: userGroup.userId, isOwner: userGroup.isOwner })],
        }),
      );
    }

    return groupsWithUsers;
  }

  async patchOne(props: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity> {
    return this.#groupsRepository.patchOne(props);
  }

  async getUserGroupsCount(props: { userId: UUID }): Promise<number> {
    return await this.#usersGroupsRepository.count(
      new UsersGroupsFindManyEntity({ userId: props.userId, deleted: false }),
    );
  }
}
