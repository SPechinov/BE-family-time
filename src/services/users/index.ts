import { randomUUID } from 'node:crypto';
import { IUsersRepository } from '@/domains/repositories/db';
import { ICryptoService, IHashPasswordService, IHashService, IUsersService } from '@/domains/services';
import {
  UserContactsEncryptedEntity,
  UserContactsHashedEntity,
  UserCreateEntity,
  UserCreatePlainEntity,
  UserEntity,
  UserFindOneEntity,
  UserFindOnePlainEntity,
  UserPasswordHashedEntity,
  UserPersonalInfoEncryptedEntity,
} from '@/entities';

export class UsersService implements IUsersService {
  readonly #usersRepository: IUsersRepository;
  readonly #hashService: IHashService;
  readonly #cryptoService: ICryptoService;
  readonly #hashPasswordService: IHashPasswordService;

  constructor(props: {
    usersRepository: IUsersRepository;
    hashService: IHashService;
    cryptoService: ICryptoService;
    hashPasswordService: IHashPasswordService;
  }) {
    this.#usersRepository = props.usersRepository;
    this.#hashService = props.hashService;
    this.#cryptoService = props.cryptoService;
    this.#hashPasswordService = props.hashPasswordService;
  }

  async create({ userCreatePlainEntity }: { userCreatePlainEntity: UserCreatePlainEntity }): Promise<UserEntity> {
    const { personalInfoPlain, contactsPlain, passwordPlain } = userCreatePlainEntity;
    const encryptionSalt = randomUUID();

    let personalInfoEncrypted: UserPersonalInfoEncryptedEntity | undefined;
    if (personalInfoPlain) {
      personalInfoEncrypted = new UserPersonalInfoEncryptedEntity({
        firstName: this.#cryptoService.encrypt(personalInfoPlain.firstName, encryptionSalt),
        lastName: personalInfoPlain.lastName
          ? this.#cryptoService.encrypt(personalInfoPlain.lastName, encryptionSalt)
          : undefined,
      });
    }

    let contactsHashed: UserContactsHashedEntity | undefined;
    let contactsEncrypted: UserContactsEncryptedEntity | undefined;
    if (contactsPlain) {
      contactsHashed = new UserContactsHashedEntity({
        email: contactsPlain.email ? this.#hashService.hash(contactsPlain.email) : undefined,
        phone: contactsPlain.phone ? this.#hashService.hash(contactsPlain.phone) : undefined,
      });

      contactsEncrypted = new UserContactsEncryptedEntity({
        email: contactsPlain.email ? this.#cryptoService.encrypt(contactsPlain.email, encryptionSalt) : undefined,
        phone: contactsPlain.phone ? this.#cryptoService.encrypt(contactsPlain.phone, encryptionSalt) : undefined,
      });
    }

    let passwordHashed: UserPasswordHashedEntity | undefined;
    if (passwordPlain?.password && passwordPlain.password.length > 0) {
      passwordHashed = new UserPasswordHashedEntity(this.#hashPasswordService.hashPassword(passwordPlain.password));
    }

    return this.#usersRepository.create(
      new UserCreateEntity({
        encryptionSalt,
        personalInfoEncrypted,
        contactsHashed,
        contactsEncrypted,
        passwordHashed,
      }),
    );
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
