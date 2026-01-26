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
    const promises: (Promise<string> | undefined)[] = Array.from({ length: 5 }, () => undefined);

    if (personalInfoPlain) {
      if (personalInfoPlain.firstName) {
        promises[0] = this.#cryptoService.encrypt(personalInfoPlain.firstName, encryptionSalt);
      }
      if (personalInfoPlain.lastName) {
        promises[1] = this.#cryptoService.encrypt(personalInfoPlain.lastName, encryptionSalt);
      }
    }

    if (contactsPlain) {
      if (contactsPlain.email) {
        promises[2] = this.#cryptoService.encrypt(contactsPlain.email, encryptionSalt);
      }
      if (contactsPlain.phone) {
        promises[3] = this.#cryptoService.encrypt(contactsPlain.phone, encryptionSalt);
      }
    }

    if (passwordPlain?.password) {
      promises[4] = this.#hashPasswordService.hashPassword(passwordPlain.password);
    }

    const [firstNameEncrypted, lastNameEncrypted, emailEncrypted, phoneEncrypted, userPasswordHashed] =
      await Promise.all(promises);

    const personalInfoEncrypted = new UserPersonalInfoEncryptedEntity({
      firstName: firstNameEncrypted,
      lastName: lastNameEncrypted,
    });

    const contactsEncrypted = new UserContactsEncryptedEntity({
      email: emailEncrypted,
      phone: phoneEncrypted,
    });

    const passwordHashed = userPasswordHashed ? new UserPasswordHashedEntity(userPasswordHashed) : undefined;

    const contactsHashed = new UserContactsHashedEntity({
      email: contactsPlain?.email ? this.#hashService.hash(contactsPlain.email) : undefined,
      phone: contactsPlain?.phone ? this.#hashService.hash(contactsPlain.phone) : undefined,
    });

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
