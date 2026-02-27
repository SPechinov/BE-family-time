import { IGroupsUsersRepository } from '@/domains/repositories/db';
import {
  GroupsUsersEntity,
  GroupsUsersCreateEntity,
  GroupsUsersFindOneEntity,
  GroupsUsersFindManyEntity,
  GroupsUsersDeleteOneEntity,
  UserId,
  GroupId,
} from '@/entities';
import { IGroupsUsersService } from '@/domains/services';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg/logger';

export class GroupsUsersService implements IGroupsUsersService {
  readonly #groupsUsersRepository: IGroupsUsersRepository;

  constructor(props: { groupsUsersRepository: IGroupsUsersRepository }) {
    this.#groupsUsersRepository = props.groupsUsersRepository;
  }

  async createOne(
    groupsUsersCreateEntity: GroupsUsersCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<GroupsUsersEntity> {
    return this.#groupsUsersRepository.createOne(groupsUsersCreateEntity, options);
  }

  async findOne(
    groupsUsersFindOneEntity: GroupsUsersFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<GroupsUsersEntity | null> {
    return this.#groupsUsersRepository.findOne(groupsUsersFindOneEntity, options);
  }

  async findMany(
    groupsUsersFindManyEntity: GroupsUsersFindManyEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<GroupsUsersEntity[]> {
    return this.#groupsUsersRepository.findMany(groupsUsersFindManyEntity, options);
  }

  async count(
    groupsUsersFindManyEntity: GroupsUsersFindManyEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<number> {
    return this.#groupsUsersRepository.count(groupsUsersFindManyEntity, options);
  }

  async deleteOne(
    groupsUsersDeleteOneEntity: GroupsUsersDeleteOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void> {
    return this.#groupsUsersRepository.deleteOne(groupsUsersDeleteOneEntity, options);
  }

  async findUserGroups(
    userId: UserId,
    options: { client?: PoolClient; logger: ILogger },
  ): Promise<GroupsUsersEntity[]> {
    return this.findMany(new GroupsUsersFindManyEntity({ userId }), options);
  }

  async findGroupUsers(
    groupId: GroupId,
    options: { client?: PoolClient; logger: ILogger },
  ): Promise<GroupsUsersEntity[]> {
    return this.findMany(new GroupsUsersFindManyEntity({ groupId }), options);
  }

  async findGroupOwners(
    groupId: GroupId,
    options: { client?: PoolClient; logger: ILogger },
  ): Promise<GroupsUsersEntity[]> {
    return this.findMany(new GroupsUsersFindManyEntity({ groupId, isOwner: true }), options);
  }
}
