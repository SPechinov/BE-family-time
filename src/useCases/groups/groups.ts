import {
  GroupCreateEntity,
  GroupEntity,
  GroupFindOneEntity,
  GroupPatchOneEntity,
  GroupWithUsersEntity,
  UserPlainEntity,
  UsersGroupsFindManyEntity,
} from '@/entities';
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

  async findUserGroupsList({
    userId,
  }: DefaultProps<{ userId: UUID }>): Promise<
    { group: GroupWithUsersEntity; users: { isOwner: boolean; user: UserPlainEntity }[] }[]
  > {
    await this.#usersService.findOneByUserIdOrThrow(userId);

    const groups = await this.#groupsService.findMany({
      usersGroupsFindManyOptions: new UsersGroupsFindManyEntity({
        userId,
      }),
    });

    return Promise.all(
      groups.map(async (group) => ({
        group,
        users: await Promise.all(
          group.users.map(async (groupUser) => ({
            isOwner: groupUser.isOwner,
            user: await this.#usersService.decryptUser(await this.#usersService.findOneByUserIdOrThrow(groupUser.id)),
          })),
        ),
      })),
    );
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
    const userGroupsCount = await this.#groupsService.getGroupsCount({
      usersGroupsFindManyEntity: new UsersGroupsFindManyEntity({ userId: userId }),
    });
    if (userGroupsCount >= CONFIG.limits.user.maxGroups) {
      throw new ErrorGroupsLimitExceeded();
    }
  }
}
