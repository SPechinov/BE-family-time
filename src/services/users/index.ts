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
  UserPatchOneEntity,
  UserPatchOnePlainEntity,
  UserPersonalInfoEncryptedEntity,
} from '@/entities';
import { ErrorUserNotExists } from '@/pkg';

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

  async createOne({ userCreatePlainEntity }: { userCreatePlainEntity: UserCreatePlainEntity }): Promise<UserEntity> {
    const { personalInfoPlain, contactsPlain, passwordPlain } = userCreatePlainEntity;
    const encryptionSalt = randomUUID();

    const [firstNameEncrypted, lastNameEncrypted, emailEncrypted, phoneEncrypted, passwordHashed] = await Promise.all([
      personalInfoPlain?.firstName
        ? this.#cryptoService.encrypt(personalInfoPlain.firstName, encryptionSalt)
        : undefined,
      personalInfoPlain?.lastName ? this.#cryptoService.encrypt(personalInfoPlain.lastName, encryptionSalt) : undefined,
      contactsPlain?.email ? this.#cryptoService.encrypt(contactsPlain.email, encryptionSalt) : undefined,
      contactsPlain?.phone ? this.#cryptoService.encrypt(contactsPlain.phone, encryptionSalt) : undefined,
      passwordPlain?.password ? this.#hashPasswordService.hashPassword(passwordPlain.password) : undefined,
    ]);

    return this.#usersRepository.createOne(
      new UserCreateEntity({
        encryptionSalt,
        personalInfoEncrypted:
          firstNameEncrypted || lastNameEncrypted
            ? new UserPersonalInfoEncryptedEntity({
                firstName: firstNameEncrypted,
                lastName: lastNameEncrypted,
              })
            : undefined,
        contactsHashed: contactsPlain?.getContact()
          ? new UserContactsHashedEntity({
              email: contactsPlain?.email ? this.#hashService.hash(contactsPlain.email) : undefined,
              phone: contactsPlain?.phone ? this.#hashService.hash(contactsPlain.phone) : undefined,
            })
          : undefined,
        contactsEncrypted:
          emailEncrypted || phoneEncrypted
            ? new UserContactsEncryptedEntity({
                email: emailEncrypted,
                phone: phoneEncrypted,
              })
            : undefined,
        passwordHashed: passwordHashed ? new UserPasswordHashedEntity(passwordHashed) : undefined,
      }),
    );
  }

  async findOne(props: { userFindOnePlainEntity: UserFindOnePlainEntity }): Promise<UserEntity | null> {
    return this.#usersRepository.findOne(this.#convertUserFindOnePlainToHashedOrThrow(props.userFindOnePlainEntity));
  }

  async patchOne({
    userFindOnePlainEntity,
    userPatchOnePlainEntity,
  }: {
    userFindOnePlainEntity: UserFindOnePlainEntity;
    userPatchOnePlainEntity: UserPatchOnePlainEntity;
  }): Promise<UserEntity> {
    const userFindOneEntity = this.#convertUserFindOnePlainToHashedOrThrow(userFindOnePlainEntity);

    const foundUser = await this.#usersRepository.findOne(userFindOneEntity);
    if (!foundUser) throw new ErrorUserNotExists();

    const userPatchOneEntity = await this.#convertUserPatchOnePlainToHashedOrThrow({
      userPatchOnePlainEntity,
      encryptionSalt: foundUser.encryptionSalt,
    });

    const userEntity = await this.#usersRepository.patchOne({ userFindOneEntity, userPatchOneEntity });
    if (!userEntity) throw new ErrorUserNotExists();

    return userEntity;
  }

  #convertUserFindOnePlainToHashedOrThrow(userFindOnePlainEntity: UserFindOnePlainEntity): UserFindOneEntity {
    const { id, contactsPlain } = userFindOnePlainEntity;
    if (id) {
      return new UserFindOneEntity({ id });
    }

    if (!contactsPlain?.getContact()) {
      throw new Error('Not enough data in UserFindOnePlainEntity');
    }

    return new UserFindOneEntity({
      contactsHashed: new UserContactsHashedEntity({
        email: contactsPlain.email ? this.#hashService.hash(contactsPlain.email) : undefined,
        phone: contactsPlain.phone ? this.#hashService.hash(contactsPlain.phone) : undefined,
      }),
    });
  }

  async #convertUserPatchOnePlainToHashedOrThrow({
    userPatchOnePlainEntity,
    encryptionSalt,
  }: {
    userPatchOnePlainEntity: UserPatchOnePlainEntity;
    encryptionSalt: string;
  }): Promise<UserPatchOneEntity> {
    const { personalInfoPlain, contactsPlain, passwordPlain } = userPatchOnePlainEntity;
    let personalInfoEncrypted: UserPersonalInfoEncryptedEntity | undefined | null;

    if (personalInfoPlain) {
      const firstName = personalInfoPlain.firstName
        ? await this.#cryptoService.encrypt(personalInfoPlain.firstName, encryptionSalt)
        : personalInfoPlain.firstName;

      const lastName = personalInfoPlain.lastName
        ? await this.#cryptoService.encrypt(personalInfoPlain.lastName, encryptionSalt)
        : personalInfoPlain.lastName;

      if (typeof firstName !== 'undefined' || typeof lastName !== 'undefined') {
        personalInfoEncrypted = new UserPersonalInfoEncryptedEntity({
          firstName,
          lastName,
        });
      } else if (userPatchOnePlainEntity.personalInfoPlain === null) {
        personalInfoEncrypted = null;
      }
    }

    let contactsEncrypted: UserContactsEncryptedEntity | undefined | null;
    let contactsHashed: UserContactsHashedEntity | undefined | null;
    if (contactsPlain) {
      const emailEncrypted = contactsPlain.email
        ? await this.#cryptoService.encrypt(contactsPlain.email, encryptionSalt)
        : contactsPlain.email;
      const phoneEncrypted = contactsPlain.phone
        ? await this.#cryptoService.encrypt(contactsPlain.phone, encryptionSalt)
        : contactsPlain.phone;
      const emailHashed = contactsPlain.email ? this.#hashService.hash(contactsPlain.email) : contactsPlain.email;
      const phoneHashed = contactsPlain.email ? this.#hashService.hash(contactsPlain.email) : contactsPlain.email;

      contactsEncrypted = new UserContactsEncryptedEntity({
        email: emailEncrypted,
        phone: phoneEncrypted,
      });
      contactsHashed = new UserContactsHashedEntity({
        email: emailHashed,
        phone: phoneHashed,
      });
    } else if (contactsPlain === null) {
      contactsEncrypted = null;
      contactsHashed = null;
    }

    let passwordHashed: UserPasswordHashedEntity | undefined | null;
    if (passwordPlain) {
      passwordHashed = new UserPasswordHashedEntity(
        await this.#hashPasswordService.hashPassword(passwordPlain.password),
      );
    } else if (passwordPlain === null) {
      passwordHashed = null;
    }

    if (
      typeof personalInfoEncrypted === 'undefined' &&
      typeof contactsEncrypted === 'undefined' &&
      typeof contactsHashed == 'undefined' &&
      typeof passwordHashed === 'undefined'
    ) {
      throw new Error('Not enough data in UserPatchOnePlainEntity');
    }

    return new UserPatchOneEntity({
      personalInfoEncrypted,
      contactsEncrypted,
      contactsHashed,
      passwordHashed,
    });
  }
}
