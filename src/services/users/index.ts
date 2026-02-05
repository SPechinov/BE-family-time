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
      throw new Error('Either id or contacts must be provided to find a user.');
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

    const personalInfoEncrypted = await this.#preparePersonalInfo(personalInfoPlain, encryptionSalt);
    const passwordHashed = await this.#preparePasswordHashed(passwordPlain);

    let contactsEncrypted: UserContactsEncryptedEntity | undefined | null;
    let contactsHashed: UserContactsHashedEntity | undefined | null;

    if (contactsPlain) {
      const { email, phone } = contactsPlain;
      const [emailEncrypted, phoneEncrypted] = await Promise.all([
        email ? this.#cryptoService.encrypt(email, encryptionSalt) : email,
        phone ? this.#cryptoService.encrypt(phone, encryptionSalt) : phone,
      ]);
      contactsEncrypted = new UserContactsEncryptedEntity({ email: emailEncrypted, phone: phoneEncrypted });
      contactsHashed = new UserContactsHashedEntity({
        email: email ? this.#hashService.hash(email) : email,
        phone: phone ? this.#hashService.hash(phone) : phone,
      });
    } else if (contactsPlain === null) {
      contactsEncrypted = null;
      contactsHashed = null;
    }

    if (
      personalInfoEncrypted === undefined &&
      contactsEncrypted === undefined &&
      contactsHashed === undefined &&
      passwordHashed === undefined
    ) {
      throw new Error('At least one field must be provided to update a user.');
    }

    return new UserPatchOneEntity({
      personalInfoEncrypted,
      contactsEncrypted,
      contactsHashed,
      passwordHashed,
    });
  }

  async #preparePersonalInfo(
    personalInfoPlain: UserPatchOnePlainEntity['personalInfoPlain'],
    encryptionSalt: string,
  ): Promise<UserPersonalInfoEncryptedEntity | undefined | null> {
    if (personalInfoPlain === undefined) return undefined;
    if (personalInfoPlain === null) return null;

    const { firstName, lastName } = personalInfoPlain;
    const [encryptedFirstName, encryptedLastName] = await Promise.all([
      firstName ? this.#cryptoService.encrypt(firstName, encryptionSalt) : firstName,
      lastName ? this.#cryptoService.encrypt(lastName, encryptionSalt) : lastName,
    ]);

    if (encryptedFirstName !== undefined || encryptedLastName !== undefined) {
      return new UserPersonalInfoEncryptedEntity({
        firstName: encryptedFirstName,
        lastName: encryptedLastName,
      });
    }
    return undefined;
  }

  async #preparePasswordHashed(
    passwordPlain: UserPatchOnePlainEntity['passwordPlain'],
  ): Promise<UserPasswordHashedEntity | undefined | null> {
    if (passwordPlain === undefined) return undefined;
    if (passwordPlain === null) return null;

    const hashedPassword = await this.#hashPasswordService.hashPassword(passwordPlain.password);
    return new UserPasswordHashedEntity(hashedPassword);
  }
}
