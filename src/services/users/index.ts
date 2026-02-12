import { randomUUID } from 'node:crypto';
import { IUsersRepository } from '@/domains/repositories/db';
import { IEncryptionService, IHashPasswordService, IHashService, IUsersService } from '@/domains/services';
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
import { ErrorUserNotExists, ILogger } from '@/pkg';

export class UsersService implements IUsersService {
  readonly #usersRepository: IUsersRepository;
  readonly #hashService: IHashService;
  readonly #encryptionService: IEncryptionService;
  readonly #hashPasswordService: IHashPasswordService;

  constructor(props: {
    usersRepository: IUsersRepository;
    hashService: IHashService;
    encryptionService: IEncryptionService;
    hashPasswordService: IHashPasswordService;
  }) {
    this.#usersRepository = props.usersRepository;
    this.#hashService = props.hashService;
    this.#encryptionService = props.encryptionService;
    this.#hashPasswordService = props.hashPasswordService;
  }

  async createOne({ userCreatePlainEntity }: { userCreatePlainEntity: UserCreatePlainEntity }): Promise<UserEntity> {
    const { personalInfoPlain, contactsPlain, passwordPlain } = userCreatePlainEntity;
    const encryptionSalt = randomUUID();

    const [personalInfoEncrypted, { contactsEncrypted, contactsHashed }, passwordHashed] = await Promise.all([
      this.#preparePersonalInfo(personalInfoPlain, encryptionSalt),
      this.#prepareContacts(contactsPlain, encryptionSalt),
      this.#preparePasswordHashed(passwordPlain),
    ]);

    return this.#usersRepository.createOne(
      new UserCreateEntity({
        encryptionSalt,
        personalInfoEncrypted: personalInfoEncrypted ?? undefined,
        contactsHashed: contactsHashed ?? undefined,
        contactsEncrypted: contactsEncrypted ?? undefined,
        passwordHashed: passwordHashed ?? undefined,
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

  verifyPassword(props: { password: string; hash: string; logger: ILogger }): Promise<boolean> {
    return this.#hashPasswordService.verify(props);
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
    const { contactsEncrypted, contactsHashed } = await this.#prepareContacts(contactsPlain, encryptionSalt);
    const passwordHashed = await this.#preparePasswordHashed(passwordPlain);

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

  async #prepareContacts(
    contactsPlain: UserPatchOnePlainEntity['contactsPlain'],
    encryptionSalt: string,
  ): Promise<{
    contactsEncrypted: UserContactsEncryptedEntity | null | undefined;
    contactsHashed: UserContactsHashedEntity | null | undefined;
  }> {
    if (contactsPlain === undefined) return { contactsEncrypted: undefined, contactsHashed: undefined };
    if (contactsPlain === null) return { contactsEncrypted: null, contactsHashed: null };

    const { email, phone } = contactsPlain;

    const [emailEncrypted, phoneEncrypted] = await Promise.all([
      email ? this.#encryptionService.encrypt(email, encryptionSalt) : Promise.resolve(email),
      phone ? this.#encryptionService.encrypt(phone, encryptionSalt) : Promise.resolve(phone),
    ]);

    const contactsEncrypted = new UserContactsEncryptedEntity({ email: emailEncrypted, phone: phoneEncrypted });
    const contactsHashed = new UserContactsHashedEntity({
      email: email ? this.#hashService.hash(email) : email,
      phone: phone ? this.#hashService.hash(phone) : phone,
    });

    return { contactsEncrypted, contactsHashed };
  }

  async #preparePersonalInfo(
    personalInfoPlain: UserPatchOnePlainEntity['personalInfoPlain'],
    encryptionSalt: string,
  ): Promise<UserPersonalInfoEncryptedEntity | undefined | null> {
    if (personalInfoPlain === undefined) return undefined;
    if (personalInfoPlain === null) return null;

    const { firstName, lastName } = personalInfoPlain;
    const [encryptedFirstName, encryptedLastName] = await Promise.all([
      firstName ? this.#encryptionService.encrypt(firstName, encryptionSalt) : Promise.resolve(firstName),
      lastName ? this.#encryptionService.encrypt(lastName, encryptionSalt) : Promise.resolve(lastName),
    ]);

    return new UserPersonalInfoEncryptedEntity({
      firstName: encryptedFirstName,
      lastName: encryptedLastName,
    });
  }

  async #preparePasswordHashed(
    passwordPlain: UserPatchOnePlainEntity['passwordPlain'],
  ): Promise<UserPasswordHashedEntity | undefined | null> {
    if (passwordPlain === undefined) return undefined;
    if (passwordPlain === null) return null;

    const hashedPassword = await this.#hashPasswordService.hash(passwordPlain.password);
    return new UserPasswordHashedEntity(hashedPassword);
  }
}
