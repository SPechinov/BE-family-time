import { GroupCreateEntity, GroupEntity, GroupFindOneEntity, GroupPatchOneEntity } from '@/entities';
import { ErrorGroupNotExists, ErrorGroupsLimitExceeded } from '@/pkg';
import { UUID } from 'node:crypto';
import { IGroupsService, IUsersService } from '@/domains/services';
import { DefaultProps, IGroupsUseCases } from '@/domains/useCases';
import { CONFIG } from '@/config';

export class GroupsUseCases implements IGroupsUseCases {
  readonly #usersService: IUsersService;
  readonly #groupsService: IGroupsService;

  constructor(props: { usersService: IUsersService; groupsService: IGroupsService }) {
    this.#usersService = props.usersService;
    this.#groupsService = props.groupsService;
  }

  async findUserGroupsList({ userId }: DefaultProps<{ userId: UUID }>): Promise<GroupEntity[]> {
    // Получить список групп
    // Получить информацию по каждой группе
    // Получить список участников каждоый группы
    await this.#usersService.findOneByUserIdOrThrow(userId);
    return [];
  }

  async createUserGroup({
    userId,
    groupCreateEntity,
    logger,
  }: DefaultProps<{ userId: UUID; groupCreateEntity: GroupCreateEntity }>): Promise<GroupEntity> {
    await this.#usersService.findOneByUserIdOrThrow(userId);
    await this.#checkUserGroupsLimitExceededOrThrow(userId);

    const group = await this.#groupsService.createOne({
      groupCreateEntity: groupCreateEntity,
      userId: userId,
    });

    logger.debug({ groupId: group.id }, 'Group created');
    return group;
  }

  async findUserGroup(
    props: DefaultProps<{ userId: UUID; groupFindOneEntity: GroupFindOneEntity }>,
  ): Promise<GroupEntity> {
    const group = await this.#groupsService.findOne({
      groupFindOneEntity: props.groupFindOneEntity,
    });
    if (!group) throw new ErrorGroupNotExists();
    return group;
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
    const userGroupsCount = await this.#groupsService.getUserGroupsCount({ userId: userId });
    if (userGroupsCount >= CONFIG.limits.user.maxGroups) {
      throw new ErrorGroupsLimitExceeded();
    }
  }
}
