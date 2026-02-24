import {
  GroupCreateEntity,
  GroupEntity,
  GroupFindOneEntity,
  GroupPatchOneEntity,
  UsersGroupsCreateEntity,
  UsersGroupsFindManyEntity,
} from '@/entities';
import { ErrorGroupNotExists, ErrorGroupsLimitExceeded } from '@/pkg';
import { UUID } from 'node:crypto';
import { IGroupsService, IUsersGroupsService, IUsersService } from '@/domains/services';
import { DefaultProps, IGroupsUseCases } from '@/domains/useCases';
import { CONFIG } from '@/config';

export class GroupsUseCases implements IGroupsUseCases {
  readonly #usersService: IUsersService;
  readonly #groupsService: IGroupsService;
  readonly #usersGroupsService: IUsersGroupsService;

  constructor(props: {
    usersService: IUsersService;
    groupsService: IGroupsService;
    usersGroupsService: IUsersGroupsService;
  }) {
    this.#usersService = props.usersService;
    this.#groupsService = props.groupsService;
    this.#usersGroupsService = props.usersGroupsService;
  }

  async createUserGroup({
    userId,
    groupCreateEntity,
    logger,
  }: DefaultProps<{ userId: UUID; groupCreateEntity: GroupCreateEntity }>): Promise<GroupEntity> {
    await this.#usersService.findOneByUserIdOrThrow(userId);
    await this.#checkUserGroupsLimitExceededOrThrow(userId);

    const group = await this.#groupsService.createOne(groupCreateEntity);

    await this.#usersGroupsService.createOne(
      new UsersGroupsCreateEntity({
        userId,
        groupId: group.id,
        isOwner: true,
      }),
    );

    logger.debug({ groupId: group.id }, 'Group created');
    return group;
  }

  async findUserGroup({
    userId,
    groupFindOneEntity,
  }: DefaultProps<{ userId: UUID; groupFindOneEntity: GroupFindOneEntity }>): Promise<GroupEntity> {
    const usersGroups = await this.#usersGroupsService.findMany(
      new UsersGroupsFindManyEntity({ userId, groupId: groupFindOneEntity.id }),
    );

    if (usersGroups.length === 0) throw new ErrorGroupNotExists();

    const group = await this.#groupsService.findOne(groupFindOneEntity);
    if (!group) throw new ErrorGroupNotExists();

    return group;
  }

  async findUserGroupsList({ userId }: DefaultProps<{ userId: UUID }>): Promise<GroupEntity[]> {
    await this.#usersService.findOneByUserIdOrThrow(userId);

    const usersGroups = await this.#usersGroupsService.findUserGroups(userId);

    const groups: GroupEntity[] = [];
    for (const userGroup of usersGroups) {
      const group = await this.#groupsService.findOne(new GroupFindOneEntity({ id: userGroup.groupId }));
      if (!group) continue;
      groups.push(group);
    }

    return groups;
  }

  async patchUserGroup(
    props: DefaultProps<{
      groupFindOneEntity: GroupFindOneEntity;
      groupPatchOneEntity: GroupPatchOneEntity;
    }>,
  ): Promise<GroupEntity> {
    return this.#groupsService.patchOne({
      groupFindOneEntity: props.groupFindOneEntity,
      groupPatchOneEntity: props.groupPatchOneEntity,
    });
  }

  async #checkUserGroupsLimitExceededOrThrow(userId: UUID) {
    const userGroupsCount = await this.#usersGroupsService.count(new UsersGroupsFindManyEntity({ userId }));
    if (userGroupsCount >= CONFIG.limits.user.maxGroups) {
      throw new ErrorGroupsLimitExceeded();
    }
  }
}
