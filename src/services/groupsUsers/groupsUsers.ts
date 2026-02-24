import { IGroupsUsersRepository } from '@/domains/repositories/db';
import {
  GroupsUsersEntity,
  GroupsUsersCreateEntity,
  GroupsUsersFindOneEntity,
  GroupsUsersFindManyEntity,
  GroupsUsersDeleteOneEntity,
} from '@/entities';
import { IGroupsUsersService } from '@/domains/services';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg/logger';
import { UUID } from 'node:crypto';
import { ErrorGroupNotExists } from '@/pkg';

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

  async findOneOrThrow(
    groupsUsersFindOneEntity: GroupsUsersFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<GroupsUsersEntity> {
    const groupUser = await this.findOne(groupsUsersFindOneEntity, options);
    if (!groupUser) {
      throw new ErrorGroupNotExists();
    }

    return groupUser;
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

  async findUserGroups(userId: UUID, options: { client?: PoolClient; logger: ILogger }): Promise<GroupsUsersEntity[]> {
    return this.findMany(new GroupsUsersFindManyEntity({ userId }), options);
  }

  async findGroupUsers(groupId: UUID, options: { client?: PoolClient; logger: ILogger }): Promise<GroupsUsersEntity[]> {
    return this.findMany(new GroupsUsersFindManyEntity({ groupId }), options);
  }

  async findGroupOwners(
    groupId: UUID,
    options: { client?: PoolClient; logger: ILogger },
  ): Promise<GroupsUsersEntity[]> {
    return this.findMany(new GroupsUsersFindManyEntity({ groupId, isOwner: true }), options);
  }
}
