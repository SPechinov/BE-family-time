import {
  GroupCreateEntity,
  GroupEntity,
  GroupFindManyEntity,
  GroupFindOneEntity,
  GroupId,
  GroupPatchOneEntity,
  GroupsUsersCreateEntity,
  GroupsUsersDeleteOneEntity,
  GroupsUsersFindManyEntity,
  GroupsUsersFindOneEntity,
  UserId,
} from '@/entities';
import {
  ErrorGroupHasUsers,
  ErrorGroupNotExists,
  ErrorGroupsLimitExceeded,
  ErrorGroupUsersCountLimitExceeded,
  ErrorUserInGroup,
  ErrorUserIsGroupOwner,
  ErrorUserIsNotGroupOwner,
  ErrorUserNotInGroup,
} from '@/pkg';
import { IGroupsService, IGroupsUsersService, IUsersService } from '@/domains/services';
import { IDbTransactionService } from '@/pkg/dbTransaction';
import { DefaultProps, IGroupsUseCases } from '@/domains/useCases';
import { CONFIG } from '@/config';
import { ILogger } from '@/pkg/logger';
import { PoolClient } from 'pg';

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

  #buildOptions(logger: ILogger, client?: PoolClient): { logger: ILogger; client?: PoolClient } {
    return { logger, client };
  }

  async createUserGroup({
    userId,
    groupCreateEntity,
    logger,
  }: DefaultProps<{ userId: UserId; groupCreateEntity: GroupCreateEntity }>): Promise<GroupEntity> {
    await this.#usersService.findOneByUserIdOrThrow(userId, { logger });

    return this.#transactionService.executeInTransaction(async (client) => {
      await this.#lockUserGroupsScope(userId, client);
      await this.#checkLimitExceededUserGroupsOrThrow(userId, this.#buildOptions(logger, client));

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
  }: DefaultProps<{ userId: UserId; groupId: GroupId }>): Promise<GroupEntity> {
    await this.#usersService.findOneByUserIdOrThrow(userId, { logger });

    const groupUser = await this.#groupsUsersService.findOne(new GroupsUsersFindOneEntity({ groupId, userId }), {
      logger,
    });
    if (!groupUser) throw new ErrorGroupNotExists();

    const group = await this.#groupsService.findOne(new GroupFindOneEntity({ id: groupId }), { logger });
    if (!group) throw new ErrorGroupNotExists();

    return group;
  }

  async findUserGroupsList({ userId, logger }: DefaultProps<{ userId: UserId }>): Promise<GroupEntity[]> {
    await this.#usersService.findOneByUserIdOrThrow(userId, { logger });

    const groupsUsers = await this.#groupsUsersService.findUserGroups(userId, { logger });
    const groupsIds = groupsUsers.map((groupUser) => groupUser.groupId);
    return this.#groupsService.findMany(new GroupFindManyEntity({ ids: groupsIds }), { logger });
  }

  async patchUserGroup({
    groupId,
    userId,
    groupPatchOneEntity,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    groupPatchOneEntity: GroupPatchOneEntity;
  }>): Promise<GroupEntity> {
    await this.#usersService.findOneByUserIdOrThrow(userId, { logger });

    await this.#checkIsGroupOwnerOrThrow(groupId, userId, { logger });

    const group = await this.#groupsService.findOne(new GroupFindOneEntity({ id: groupId }), { logger });
    if (!group) throw new ErrorGroupNotExists();

    const patchedGroup = await this.#groupsService.patchOne(
      {
        groupFindOneEntity: new GroupFindOneEntity({ id: groupId }),
        groupPatchOneEntity: groupPatchOneEntity,
      },
      { logger: logger },
    );
    if (!patchedGroup) throw new ErrorGroupNotExists();

    return patchedGroup;
  }

  async inviteUserInGroup({
    groupId,
    actorUserId,
    targetUserId,
    logger,
  }: DefaultProps<{ targetUserId: UserId; actorUserId: UserId; groupId: GroupId }>): Promise<void> {
    await Promise.all([
      this.#usersService.findOneByUserIdOrThrow(actorUserId, { logger }),
      this.#usersService.findOneByUserIdOrThrow(targetUserId, { logger }),
    ]);

    await this.#transactionService.executeInTransaction(async (client) => {
      await this.#lockGroupMembersScope(groupId, client);
      await this.#checkIsGroupOwnerOrThrow(groupId, actorUserId, this.#buildOptions(logger, client));
      await this.#checkUserNotInGroupOrThrow(groupId, targetUserId, this.#buildOptions(logger, client));
      await this.#checkLimitExceededUsersInGroupOrThrow(groupId, this.#buildOptions(logger, client));

      await this.#groupsUsersService.createOne(
        new GroupsUsersCreateEntity({ userId: targetUserId, groupId: groupId, isOwner: false }),
        { logger, client },
      );
    });
  }

  async excludeUserFromGroup({
    groupId,
    actorUserId,
    targetUserId,
    logger,
  }: DefaultProps<{ targetUserId: UserId; actorUserId: UserId; groupId: GroupId }>): Promise<void> {
    await Promise.all([
      this.#usersService.findOneByUserIdOrThrow(actorUserId, { logger }),
      this.#usersService.findOneByUserIdOrThrow(targetUserId, { logger }),
    ]);

    await this.#checkIsGroupOwnerOrThrow(groupId, actorUserId, { logger });

    if (actorUserId === targetUserId) {
      throw new ErrorUserIsGroupOwner();
    }

    await this.#checkUserInGroupOrThrow(groupId, targetUserId, { logger });

    await this.#groupsUsersService.deleteOne(
      new GroupsUsersDeleteOneEntity({ userId: targetUserId, groupId: groupId }),
      { logger: logger },
    );
  }

  async deleteUserGroup({
    groupId,
    userId,
    logger,
  }: DefaultProps<{ userId: UserId; groupId: GroupId }>): Promise<void> {
    await this.#usersService.findOneByUserIdOrThrow(userId, { logger });

    await this.#transactionService.executeInTransaction(async (client) => {
      await this.#lockGroupMembersScope(groupId, client);
      await this.#checkIsGroupOwnerOrThrow(groupId, userId, this.#buildOptions(logger, client));

      const groupUsersCount = await this.#groupsUsersService.count(new GroupsUsersFindManyEntity({ groupId }), {
        logger,
        client,
      });
      if (groupUsersCount > 1) {
        throw new ErrorGroupHasUsers();
      }

      await this.#groupsService.deleteOne(new GroupFindOneEntity({ id: groupId }), { logger, client });
    });
  }

  async #checkUserNotInGroupOrThrow(
    groupId: GroupId,
    userId: UserId,
    options: { logger: ILogger; client?: PoolClient },
  ) {
    const groupUser = await this.#groupsUsersService.findOne(
      new GroupsUsersFindOneEntity({
        groupId,
        userId,
      }),
      options,
    );

    if (groupUser) throw new ErrorUserInGroup();
  }

  async #checkUserInGroupOrThrow(groupId: GroupId, userId: UserId, options: { logger: ILogger; client?: PoolClient }) {
    const groupUser = await this.#groupsUsersService.findOne(
      new GroupsUsersFindOneEntity({ groupId, userId }),
      options,
    );
    if (!groupUser) throw new ErrorUserNotInGroup();
  }

  async #checkIsGroupOwnerOrThrow(groupId: GroupId, userId: UserId, options: { logger: ILogger; client?: PoolClient }) {
    const groupUser = await this.#groupsUsersService.findOne(
      new GroupsUsersFindOneEntity({ groupId, userId }),
      options,
    );

    if (!groupUser) {
      throw new ErrorGroupNotExists();
    }

    if (!groupUser.isOwner) {
      throw new ErrorUserIsNotGroupOwner();
    }
  }

  async #checkLimitExceededUsersInGroupOrThrow(groupId: GroupId, options: { logger: ILogger; client?: PoolClient }) {
    const usersCount = await this.#groupsUsersService.count(
      new GroupsUsersFindManyEntity({
        groupId,
      }),
      options,
    );

    if (usersCount >= CONFIG.limits.group.maxUsers) {
      throw new ErrorGroupUsersCountLimitExceeded();
    }
  }

  async #checkLimitExceededUserGroupsOrThrow(userId: UserId, options: { logger: ILogger; client?: PoolClient }) {
    const userGroupsCount = await this.#groupsUsersService.count(new GroupsUsersFindManyEntity({ userId }), options);
    if (userGroupsCount >= CONFIG.limits.user.maxGroups) {
      throw new ErrorGroupsLimitExceeded();
    }
  }

  async #lockUserGroupsScope(userId: UserId, client: PoolClient) {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`groups:user:${userId}`]);
  }

  async #lockGroupMembersScope(groupId: GroupId, client: PoolClient) {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`groups:group:${groupId}`]);
  }
}
