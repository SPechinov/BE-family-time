import {
  GroupCreateEntity,
  GroupEntity,
  GroupFindManyEntity,
  GroupFindOneEntity,
  GroupPatchOneEntity,
  GroupsUsersCreateEntity,
  GroupsUsersFindManyEntity,
} from '@/entities';
import { ErrorGroupNotExists, ErrorGroupsLimitExceeded } from '@/pkg';
import { UUID } from 'node:crypto';
import { IGroupsService, IGroupsUsersService, IUsersService } from '@/domains/services';
import { IDbTransactionService } from '@/pkg/dbTransaction';
import { DefaultProps, IGroupsUseCases } from '@/domains/useCases';
import { CONFIG } from '@/config';

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
    await this.#usersService.findOneByUserIdOrThrow(userId);
    await this.#checkUserGroupsLimitExceededOrThrow(userId);

    return this.#transactionService.executeInTransaction(async (client) => {
      const group = await this.#groupsService.createOne(groupCreateEntity, { client });

      await this.#groupsUsersService.createOne(
        new GroupsUsersCreateEntity({
          userId,
          groupId: group.id,
          isOwner: true,
        }),
        { client },
      );

      logger.debug({ groupId: group.id }, 'Group created');
      return group;
    });
  }

  async findUserGroup({
    userId,
    groupFindOneEntity,
  }: DefaultProps<{ userId: UUID; groupFindOneEntity: GroupFindOneEntity }>): Promise<GroupEntity> {
    const groupsUsers = await this.#groupsUsersService.findMany(
      new GroupsUsersFindManyEntity({ userId, groupId: groupFindOneEntity.id }),
    );

    if (groupsUsers.length === 0) throw new ErrorGroupNotExists();

    const group = await this.#groupsService.findOne(groupFindOneEntity);
    if (!group) throw new ErrorGroupNotExists();

    return group;
  }

  async findUserGroupsList({ userId }: DefaultProps<{ userId: UUID }>): Promise<GroupEntity[]> {
    await this.#usersService.findOneByUserIdOrThrow(userId);

    const groupsUsers = await this.#groupsUsersService.findUserGroups(userId);
    const groupsIds = groupsUsers.map((groupUser) => groupUser.groupId);
    return this.#groupsService.findMany(new GroupFindManyEntity({ ids: groupsIds }));
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
    const userGroupsCount = await this.#groupsUsersService.count(new GroupsUsersFindManyEntity({ userId }));
    if (userGroupsCount >= CONFIG.limits.user.maxGroups) {
      throw new ErrorGroupsLimitExceeded();
    }
  }
}
