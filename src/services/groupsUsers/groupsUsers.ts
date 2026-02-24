import { IGroupsUsersRepository } from '@/domains/repositories/db';
import {
  GroupsUsersEntity,
  GroupsUsersCreateEntity,
  GroupsUsersFindOneEntity,
  GroupsUsersFindManyEntity,
  GroupsUsersDeleteOneEntity,
} from '@/entities';
import { IGroupsUsersService } from '@/domains/services';
import { UUID } from 'node:crypto';

export class GroupsUsersService implements IGroupsUsersService {
  readonly #groupsUsersRepository: IGroupsUsersRepository;

  constructor(props: { groupsUsersRepository: IGroupsUsersRepository }) {
    this.#groupsUsersRepository = props.groupsUsersRepository;
  }

  async createOne(groupsUsersCreateEntity: GroupsUsersCreateEntity): Promise<GroupsUsersEntity> {
    return this.#groupsUsersRepository.createOne(groupsUsersCreateEntity);
  }

  async findOne(groupsUsersFindOneEntity: GroupsUsersFindOneEntity): Promise<GroupsUsersEntity | null> {
    return this.#groupsUsersRepository.findOne(groupsUsersFindOneEntity);
  }

  async findMany(groupsUsersFindManyEntity: GroupsUsersFindManyEntity): Promise<GroupsUsersEntity[]> {
    return this.#groupsUsersRepository.findMany(groupsUsersFindManyEntity);
  }

  async count(groupsUsersFindManyEntity: GroupsUsersFindManyEntity): Promise<number> {
    return this.#groupsUsersRepository.count(groupsUsersFindManyEntity);
  }

  async deleteOne(groupsUsersDeleteOneEntity: GroupsUsersDeleteOneEntity): Promise<void> {
    return this.#groupsUsersRepository.deleteOne(groupsUsersDeleteOneEntity);
  }

  async findUserGroups(userId: UUID): Promise<GroupsUsersEntity[]> {
    return this.findMany(new GroupsUsersFindManyEntity({ userId }));
  }

  async findGroupUsers(groupId: UUID): Promise<GroupsUsersEntity[]> {
    return this.findMany(new GroupsUsersFindManyEntity({ groupId }));
  }

  async findGroupOwners(groupId: UUID): Promise<GroupsUsersEntity[]> {
    return this.findMany(new GroupsUsersFindManyEntity({ groupId, isOwner: true }));
  }
}
