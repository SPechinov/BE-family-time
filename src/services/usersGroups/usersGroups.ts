import { IUsersGroupsRepository } from '@/domains/repositories/db';
import {
  UsersGroupsEntity,
  UsersGroupsCreateEntity,
  UsersGroupsFindOneEntity,
  UsersGroupsFindManyEntity,
  UsersGroupsDeleteOneEntity,
} from '@/entities';
import { IUsersGroupsService } from '@/domains/services';
import { UUID } from 'node:crypto';

export class UsersGroupsService implements IUsersGroupsService {
  readonly #usersGroupsRepository: IUsersGroupsRepository;

  constructor(props: { usersGroupsRepository: IUsersGroupsRepository }) {
    this.#usersGroupsRepository = props.usersGroupsRepository;
  }

  async createOne(usersGroupsCreateEntity: UsersGroupsCreateEntity): Promise<UsersGroupsEntity> {
    return this.#usersGroupsRepository.createOne(usersGroupsCreateEntity);
  }

  async findOne(usersGroupsFindOneEntity: UsersGroupsFindOneEntity): Promise<UsersGroupsEntity | null> {
    return this.#usersGroupsRepository.findOne(usersGroupsFindOneEntity);
  }

  async findMany(usersGroupsFindManyEntity: UsersGroupsFindManyEntity): Promise<UsersGroupsEntity[]> {
    return this.#usersGroupsRepository.findMany(usersGroupsFindManyEntity);
  }

  async count(usersGroupsFindManyEntity: UsersGroupsFindManyEntity): Promise<number> {
    return this.#usersGroupsRepository.count(usersGroupsFindManyEntity);
  }

  async deleteOne(usersGroupsDeleteOneEntity: UsersGroupsDeleteOneEntity): Promise<void> {
    return this.#usersGroupsRepository.deleteOne(usersGroupsDeleteOneEntity);
  }

  async findUserGroups(userId: UUID): Promise<UsersGroupsEntity[]> {
    return this.findMany(new UsersGroupsFindManyEntity({ userId }));
  }

  async findGroupUsers(groupId: UUID): Promise<UsersGroupsEntity[]> {
    return this.findMany(new UsersGroupsFindManyEntity({ groupId }));
  }

  async findGroupOwners(groupId: UUID): Promise<UsersGroupsEntity[]> {
    return this.findMany(new UsersGroupsFindManyEntity({ groupId, isOwner: true }));
  }
}
