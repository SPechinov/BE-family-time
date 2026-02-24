import {
  GroupCreateEntity,
  GroupEntity,
  GroupFindManyEntity,
  GroupFindOneEntity,
  GroupPatchOneEntity,
  GroupsUsersCreateEntity,
  GroupsUsersFindManyEntity,
  GroupsUsersFindOneEntity,
} from '@/entities';
import { ErrorGroupNotExists, ErrorGroupsLimitExceeded } from '@/pkg';
import { UUID } from 'node:crypto';
import { IGroupsService, IGroupsUsersService, IUsersService } from '@/domains/services';
import { IDbTransactionService } from '@/pkg/dbTransaction';
import { DefaultProps, IGroupsUseCases } from '@/domains/useCases';
import { CONFIG } from '@/config';
import { ILogger } from '@/pkg/logger';

export class GroupsUseCases implements IGroupsUseCases {
  readonly #usersService: IUsersService;
  readonly #groupsService: IGroupsService;
  readonly #groupsUsersService: IGroupsUsersService;
  readonly #transactionService: IDbTransactionService;

  constructor(props: {
    usersService: IUsersService;
    groupsService: IGroupsService;
    groupsUsersService: IGroupsUsersService;
    transactionService: IDbTransactionService;
  }) {
    this.#usersService = props.usersService;
    this.#groupsService = props.groupsService;
    this.#groupsUsersService = props.groupsUsersService;
    this.#transactionService = props.transactionService;
  }

  async createUserGroup({
    userId,
    groupCreateEntity,
    logger,
  }: DefaultProps<{ userId: UUID; groupCreateEntity: GroupCreateEntity }>): Promise<GroupEntity> {
    await this.#usersService.findOneByUserIdOrThrow(userId, { logger });
    await this.#checkUserGroupsLimitExceededOrThrow(userId, { logger });

    return this.#transactionService.executeInTransaction(async (client) => {
      const group = await this.#groupsService.createOne(groupCreateEntity, { client, logger });

      await this.#groupsUsersService.createOne(
        new GroupsUsersCreateEntity({
          userId,
          groupId: group.id,
          isOwner: true,
        }),
        { client, logger },
      );

      logger.debug({ groupId: group.id }, 'Group created');
      return group;
    });
  }

  async findUserGroup({
    userId,
    groupId,
    logger,
  }: DefaultProps<{ userId: UUID; groupId: UUID }>): Promise<GroupEntity> {
    const [, groupUser, group] = await Promise.all([
      this.#usersService.findOneByUserIdOrThrow(userId, { logger }),
      this.#groupsUsersService.findOne(new GroupsUsersFindOneEntity({ groupId, userId }), { logger }),
      this.#groupsService.findOne(new GroupFindOneEntity({ id: groupId }), { logger }),
    ]);

    if (!groupUser || !group) {
      throw new ErrorGroupNotExists();
    }

    return group;
  }

  async findUserGroupsList({ userId, logger }: DefaultProps<{ userId: UUID }>): Promise<GroupEntity[]> {
    await this.#usersService.findOneByUserIdOrThrow(userId, { logger });

    const groupsUsers = await this.#groupsUsersService.findUserGroups(userId, { logger });
    const groupsIds = groupsUsers.map((groupUser) => groupUser.groupId);
    return this.#groupsService.findMany(new GroupFindManyEntity({ ids: groupsIds }), { logger });
  }

  async patchUserGroup(
    props: DefaultProps<{
      groupFindOneEntity: GroupFindOneEntity;
      groupPatchOneEntity: GroupPatchOneEntity;
    }>,
  ): Promise<GroupEntity> {
    return this.#groupsService.patchOne(
      {
        groupFindOneEntity: props.groupFindOneEntity,
        groupPatchOneEntity: props.groupPatchOneEntity,
      },
      { logger: props.logger },
    );
  }

  async #checkUserGroupsLimitExceededOrThrow(userId: UUID, options: { logger: ILogger }) {
    const userGroupsCount = await this.#groupsUsersService.count(new GroupsUsersFindManyEntity({ userId }), options);
    if (userGroupsCount >= CONFIG.limits.user.maxGroups) {
      throw new ErrorGroupsLimitExceeded();
    }
  }
}
