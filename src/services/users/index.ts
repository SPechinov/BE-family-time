import { IUsersRepository } from '@/domains/repositories/db';
import { IUsersService } from '@/domains/services';
import { UserCreatePlainEntity, UserEntity } from '@/entities';

export class UsersService implements IUsersService {
  readonly #usersRepository: IUsersRepository;

  constructor(props: { usersRepository: IUsersRepository }) {
    this.#usersRepository = props.usersRepository;
  }

  async create(props: { userCreatePlainEntity: UserCreatePlainEntity }): Promise<UserEntity> {
    return new UserEntity({ id: '', createdAt: new Date(), updatedAt: new Date() });
  }
}
