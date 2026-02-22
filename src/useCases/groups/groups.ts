import {
  GroupCreateEntity,
  GroupEntity,
  GroupFindOneEntity,
  GroupPatchOneEntity,
  UserFindOnePlainEntity,
} from '@/entities';
import { ErrorGroupNotExists, ErrorGroupsLimitExceeded, ErrorUserNotExists } from '@/pkg';
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

  async findUserGroupsList(props: DefaultProps<{ userId: UUID }>): Promise<GroupEntity[]> {
    return [];
  }

  async createUserGroup({
    userId,
    groupCreateEntity,
    logger,
  }: DefaultProps<{ userId: UUID; groupCreateEntity: GroupCreateEntity }>): Promise<GroupEntity> {
    const foundUser = await this.#usersService.findOne({
      userFindOnePlainEntity: new UserFindOnePlainEntity({ id: userId }),
    });
    if (!foundUser) throw new ErrorUserNotExists();
    const userGroupsCount = await this.#groupsService.getUserGroupsCount({ userId: userId });
    if (userGroupsCount >= CONFIG.limits.user.maxGroups) {
      throw new ErrorGroupsLimitExceeded();
    }

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
}
