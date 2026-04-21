import { CONFIG } from '@/config';
import { IGroupsUsersService } from '@/domains/services';
import { GroupId, GroupsUsersFindManyEntity, GroupsUsersFindOneEntity, UserId } from '@/entities';
import {
  ErrorGroupNotExists,
  ErrorGroupsLimitExceeded,
  ErrorGroupUsersCountLimitExceeded,
  ErrorUserInGroup,
  ErrorUserIsNotGroupOwner,
  ErrorUserNotInGroup,
} from '@/pkg';
import { ILogger } from '@/pkg/logger';
import { PoolClient } from 'pg';

export class GroupsGuards {
  readonly #groupsUsersService: IGroupsUsersService;

  constructor(props: { groupsUsersService: IGroupsUsersService }) {
    this.#groupsUsersService = props.groupsUsersService;
  }

  async checkUserNotInGroupOrThrow(
    groupId: GroupId,
    userId: UserId,
    options: { logger: ILogger; client?: PoolClient },
  ): Promise<void> {
    const groupUser = await this.#groupsUsersService.findOne(new GroupsUsersFindOneEntity({ groupId, userId }), options);
    if (groupUser) throw new ErrorUserInGroup();
  }

  async checkUserInGroupOrThrow(
    groupId: GroupId,
    userId: UserId,
    options: { logger: ILogger; client?: PoolClient },
  ): Promise<void> {
    const groupUser = await this.#groupsUsersService.findOne(new GroupsUsersFindOneEntity({ groupId, userId }), options);
    if (!groupUser) throw new ErrorUserNotInGroup();
  }

  async checkIsGroupOwnerOrThrow(
    groupId: GroupId,
    userId: UserId,
    options: { logger: ILogger; client?: PoolClient },
  ): Promise<void> {
    const groupUser = await this.#groupsUsersService.findOne(new GroupsUsersFindOneEntity({ groupId, userId }), options);
    if (!groupUser) throw new ErrorGroupNotExists();
    if (!groupUser.isOwner) throw new ErrorUserIsNotGroupOwner();
  }

  async checkLimitExceededUsersInGroupOrThrow(
    groupId: GroupId,
    options: { logger: ILogger; client?: PoolClient },
  ): Promise<void> {
    const usersCount = await this.#groupsUsersService.count(new GroupsUsersFindManyEntity({ groupId }), options);
    if (usersCount >= CONFIG.limits.group.maxUsers) throw new ErrorGroupUsersCountLimitExceeded();
  }

  async checkLimitExceededUserGroupsOrThrow(
    userId: UserId,
    options: { logger: ILogger; client?: PoolClient },
  ): Promise<void> {
    const userGroupsCount = await this.#groupsUsersService.count(new GroupsUsersFindManyEntity({ userId }), options);
    if (userGroupsCount >= CONFIG.limits.user.maxGroups) throw new ErrorGroupsLimitExceeded();
  }
}
