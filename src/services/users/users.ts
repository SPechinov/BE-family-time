import { randomUUID } from 'node:crypto';
import { IUsersRepository } from '@/domains/repositories/db';
import { IEncryptionService, IHashPasswordService, IHmacService, IUsersService } from '@/domains/services';
import {
  UserContactsEncryptedEntity,
  UserContactsHashedEntity,
  UserContactsPlainEntity,
  UserCreateEntity,
  UserCreatePlainEntity,
  UserFindOneEntity,
  UserFindOnePlainEntity,
  UserEntity,
  UserPasswordHashedEntity,
  UserPatchOnePlainEntity,
  UserPersonalInfoEncryptedEntity,
  UserPersonalInfoPlainEntity,
  UserPlainEntity,
  UserId,
} from '@/entities';
import { ErrorInvalidUserFindParams, ErrorUserNotExists } from '@/pkg/errors';
import { ILogger } from '@/pkg/logger';
import { PoolClient } from 'pg';
import { UserPatchMapper } from './userPatchMapper';

export class UsersService implements IUsersService {
  readonly #usersRepository: IUsersRepository;
  readonly #hmacService: IHmacService;
  readonly #encryptionService: IEncryptionService;
  readonly #hashPasswordService: IHashPasswordService;
  readonly #userPatchMapper: UserPatchMapper;

  constructor(props: {
    usersRepository: IUsersRepository;
    hmacService: IHmacService;
    encryptionService: IEncryptionService;
    hashPasswordService: IHashPasswordService;
  }) {
    this.#usersRepository = props.usersRepository;
    this.#hmacService = props.hmacService;
    this.#encryptionService = props.encryptionService;
    this.#hashPasswordService = props.hashPasswordService;
    this.#userPatchMapper = new UserPatchMapper({
      hmacService: this.#hmacService,
      encryptionService: this.#encryptionService,
      hashPasswordService: this.#hashPasswordService,
    });
  }

  async createOne(
    userCreatePlainEntity: UserCreatePlainEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<UserEntity> {
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
        timeZone: userCreatePlainEntity.timeZone,
        language: userCreatePlainEntity.language,
        dateOfBirth: personalInfoPlain?.dateOfBirth,
        personalInfoEncrypted: personalInfoEncrypted ?? undefined,
        contactsHashed: contactsHashed ?? undefined,
        contactsEncrypted: contactsEncrypted ?? undefined,
        passwordHashed: passwordHashed ?? undefined,
      }),
      options,
    );
  }

  async findOne(
    userFindOnePlainEntity: UserFindOnePlainEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<UserEntity | null> {
    return this.#usersRepository.findOne(this.#convertUserFindOnePlainToHashedOrThrow(userFindOnePlainEntity), options);
  }

  async findOneByUserIdOrThrow(
    userId: UserId,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<UserEntity> {
    const foundUser = await this.#usersRepository.findOne(new UserFindOneEntity({ id: userId }), options);
    if (!foundUser) {
      throw new ErrorUserNotExists();
    }

    return foundUser;
  }

  async patchOne(
    {
      userFindOnePlainEntity,
      userPatchOnePlainEntity,
    }: {
      userFindOnePlainEntity: UserFindOnePlainEntity;
      userPatchOnePlainEntity: UserPatchOnePlainEntity;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<UserEntity> {
    const userFindOneEntity = this.#convertUserFindOnePlainToHashedOrThrow(userFindOnePlainEntity);

    const foundUser = await this.#usersRepository.findOne(userFindOneEntity, options);
    if (!foundUser) throw new ErrorUserNotExists();

    const userPatchOneEntity = await this.#userPatchMapper.mapPlainToEncrypted({
      userPatchOnePlainEntity,
      encryptionSalt: foundUser.encryptionSalt,
    });

    const userEntity = await this.#usersRepository.patchOne({ userFindOneEntity, userPatchOneEntity }, options);
    if (!userEntity) throw new ErrorUserNotExists();

    return userEntity;
  }

  async decryptUser(userEntity: UserEntity): Promise<UserPlainEntity> {
    const [contacts, personalInfo] = await Promise.all([
      this.#decryptContacts(userEntity.encryptionSalt, userEntity.contactsEncrypted),
      this.#decryptPersonalInfo(userEntity.encryptionSalt, userEntity.personalInfoEncrypted, userEntity.dateOfBirth),
    ]);

    return new UserPlainEntity({
      id: userEntity.id,
      timeZone: userEntity.timeZone,
      language: userEntity.language,
      createdAt: userEntity.createdAt,
      updatedAt: userEntity.updatedAt,
      contacts,
      personalInfo,
    });
  }

  verifyPassword(props: { password: string; hash: string }, options?: { logger?: ILogger }): Promise<boolean> {
    return this.#hashPasswordService.verify(props, options);
  }

  async #decryptContacts(
    encryptionSalt: string,
    contactsEncrypted?: UserContactsEncryptedEntity,
  ): Promise<UserContactsPlainEntity | undefined> {
    if (!(contactsEncrypted instanceof UserContactsEncryptedEntity)) {
      return;
    }

    if (!contactsEncrypted.getContact()) return;

    const { email, phone } = contactsEncrypted;
    return new UserContactsPlainEntity({
      email: email ? await this.#encryptionService.decrypt(email, encryptionSalt) : undefined,
      phone: phone ? await this.#encryptionService.decrypt(phone, encryptionSalt) : undefined,
    });
  }

  async #decryptPersonalInfo(
    encryptionSalt: string,
    personalInfoEncrypted?: UserPersonalInfoEncryptedEntity,
    dateOfBirth?: Date | null,
  ): Promise<UserPersonalInfoPlainEntity | undefined> {
    if (!(personalInfoEncrypted instanceof UserPersonalInfoEncryptedEntity)) {
      if (dateOfBirth === undefined) return;

      return new UserPersonalInfoPlainEntity({ dateOfBirth });
    }

    if (
      personalInfoEncrypted.firstName === undefined &&
      personalInfoEncrypted.lastName === undefined &&
      dateOfBirth === undefined
    ) {
      return;
    }

    const { firstName, lastName } = personalInfoEncrypted;

    return new UserPersonalInfoPlainEntity({
      firstName: firstName ? await this.#decryptOptionalField(firstName, encryptionSalt) : undefined,
      lastName: lastName ? await this.#decryptOptionalField(lastName, encryptionSalt) : undefined,
      dateOfBirth,
    });
  }

  async #decryptOptionalField(value: string, encryptionSalt: string): Promise<string | null> {
    if (value.trim() === '' || value.split(':').length !== 3) {
      return null;
    }

    try {
      return await this.#encryptionService.decrypt(value, encryptionSalt);
    } catch {
      return null;
    }
  }

  #convertUserFindOnePlainToHashedOrThrow(userFindOnePlainEntity: UserFindOnePlainEntity): UserFindOneEntity {
    const { id, contactsPlain } = userFindOnePlainEntity;
    if (id) {
      return new UserFindOneEntity({ id });
    }

    if (!contactsPlain?.getContact()) {
      throw new ErrorInvalidUserFindParams();
    }

    return new UserFindOneEntity({
      contactsHashed: new UserContactsHashedEntity({
        email: contactsPlain.email ? this.#hmacService.hash(contactsPlain.email) : undefined,
        phone: contactsPlain.phone ? this.#hmacService.hash(contactsPlain.phone) : undefined,
      }),
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
      firstName === undefined
        ? Promise.resolve(undefined)
        : firstName === null
          ? Promise.resolve(null)
          : this.#encryptionService.encrypt(firstName, encryptionSalt),
      lastName === undefined
        ? Promise.resolve(undefined)
        : lastName === null
          ? Promise.resolve(null)
          : this.#encryptionService.encrypt(lastName, encryptionSalt),
    ]);

    return new UserPersonalInfoEncryptedEntity({
      firstName: encryptedFirstName,
      lastName: encryptedLastName,
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
      email: email ? this.#hmacService.hash(email) : email,
      phone: phone ? this.#hmacService.hash(phone) : phone,
    });

    return { contactsEncrypted, contactsHashed };
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
