import { randomUUID } from 'node:crypto';
import { IUsersRepository } from '@/domains/repositories/db';
import { IEncryptionService, IHashPasswordService, IHmacService, IUsersService } from '@/domains/services';
import {
  UserCreatePlainEntity,
  UserFindOneEntity,
  UserFindOnePlainEntity,
  UserEntity,
  UserPatchOnePlainEntity,
  UserPlainEntity,
  UserId,
} from '@/entities';
import { ErrorUserNotExists } from '@/pkg/errors';
import { ILogger } from '@/pkg/logger';
import { PoolClient } from 'pg';
import { UserContactsHasher } from './userContactsHasher';
import { UserCreateMapper } from './userCreateMapper';
import { UserCryptoMapper } from './userCryptoMapper';
import { UserFindMapper } from './userFindMapper';
import { UserPatchMapper } from './userPatchMapper';
import { UserPasswordHasher } from './userPasswordHasher';

export class UsersService implements IUsersService {
  readonly #usersRepository: IUsersRepository;
  readonly #hashPasswordService: IHashPasswordService;
  readonly #userCreateMapper: UserCreateMapper;
  readonly #userFindMapper: UserFindMapper;
  readonly #userCryptoMapper: UserCryptoMapper;
  readonly #userPatchMapper: UserPatchMapper;

  constructor(props: {
    usersRepository: IUsersRepository;
    hmacService: IHmacService;
    encryptionService: IEncryptionService;
    hashPasswordService: IHashPasswordService;
  }) {
    this.#usersRepository = props.usersRepository;
    this.#hashPasswordService = props.hashPasswordService;

    const userContactsHasher = new UserContactsHasher({ hmacService: props.hmacService });
    const userPasswordHasher = new UserPasswordHasher({ hashPasswordService: props.hashPasswordService });
    this.#userCryptoMapper = new UserCryptoMapper({ encryptionService: props.encryptionService });
    this.#userCreateMapper = new UserCreateMapper({
      userCryptoMapper: this.#userCryptoMapper,
      userContactsHasher,
      userPasswordHasher,
    });
    this.#userFindMapper = new UserFindMapper({ userContactsHasher });
    this.#userPatchMapper = new UserPatchMapper({
      userContactsHasher,
      userCryptoMapper: this.#userCryptoMapper,
      userPasswordHasher,
    });
  }

  async createOne(
    userCreatePlainEntity: UserCreatePlainEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<UserEntity> {
    const encryptionSalt = randomUUID();
    const userCreateEntity = await this.#userCreateMapper.mapPlainToCreate({
      userCreatePlainEntity,
      encryptionSalt,
    });

    return this.#usersRepository.createOne(userCreateEntity, options);
  }

  async findOne(
    userFindOnePlainEntity: UserFindOnePlainEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<UserEntity | null> {
    return this.#usersRepository.findOne(this.#userFindMapper.mapPlainToFindOrThrow(userFindOnePlainEntity), options);
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
    const userFindOneEntity = this.#userFindMapper.mapPlainToFindOrThrow(userFindOnePlainEntity);

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
      this.#userCryptoMapper.decryptContacts(userEntity.encryptionSalt, userEntity.contactsEncrypted),
      this.#userCryptoMapper.decryptPersonalInfo(
        userEntity.encryptionSalt,
        userEntity.personalInfoEncrypted,
        userEntity.dateOfBirth,
      ),
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
}
