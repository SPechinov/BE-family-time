import { IUsersRepository } from '@/domains/repositories/db';
import { UserCreateEntity, UserEntity, UserFindOneEntity } from '@/entities';
import { Pool } from 'pg';

export class UsersRepository implements IUsersRepository {
  readonly #pool: Pool;

  constructor(props: { pool: Pool }) {
    this.#pool = props.pool;
  }

  async create(userCreateEntity: UserCreateEntity): Promise<UserEntity> {
    return new UserEntity({
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async findOne(userFindOneEntity: UserFindOneEntity): Promise<UserEntity | null> {
    return null;
  }
}
