import { IUsersRepository } from '@/domains/repositories/db';
import { IHashService, IUsersService } from '@/domains/services';
import {
  UserContactsHashedEntity,
  UserCreatePlainEntity,
  UserEntity,
  UserFindOneEntity,
  UserFindOnePlainEntity,
} from '@/entities';

export class UsersService implements IUsersService {
  readonly #usersRepository: IUsersRepository;
  readonly #hashService: IHashService;

  constructor(props: { usersRepository: IUsersRepository; hashService: IHashService }) {
    this.#usersRepository = props.usersRepository;
    this.#hashService = props.hashService;
  }

  async create(props: { userCreatePlainEntity: UserCreatePlainEntity }): Promise<UserEntity> {
    return new UserEntity({ id: '', createdAt: new Date(), updatedAt: new Date() });
  }

  async findUser({
    userFindOnePlainEntity,
  }: {
    userFindOnePlainEntity: UserFindOnePlainEntity;
  }): Promise<UserEntity | null> {
    let contactsHashed: UserContactsHashedEntity | undefined;

    if (userFindOnePlainEntity.contactsPlain?.getContact()) {
      const { contactsPlain } = userFindOnePlainEntity;
      contactsHashed = new UserContactsHashedEntity({
        email: contactsPlain.email ? this.#hashService.hash(contactsPlain.email) : undefined,
        phone: contactsPlain.phone ? this.#hashService.hash(contactsPlain.phone) : undefined,
      });
    }

    return this.#usersRepository.findOne(
      new UserFindOneEntity({
        id: userFindOnePlainEntity.id,
        contactsHashed,
      }),
    );
  }
}
