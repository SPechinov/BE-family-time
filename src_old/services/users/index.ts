import {
  UserContactsEncryptedEntity,
  UserContactsEncryptedPatchEntity,
  UserContactsHashedEntity,
  UserContactsHashedPatchEntity,
  UserCreateEntity,
  UserEntity,
  UserFindEntity,
  UserPatchEntity,
  UserPersonalInfoPatchEntity,
  UserPlainCreateEntity,
  UserPlainFindEntity,
  UserPlainPatchEntity,
} from '@/domain/entities';
import {
  ICryptoService,
  IHashPasswordService,
  IHashService,
  IHashServiceConfig,
  IUserService,
} from '@/domain/services';
import { CONFIG } from '@/config';
import { IUsersRepository } from '@/domain/repositories/db';

const HASH_CONFIG: IHashServiceConfig = {
  salt: CONFIG.salts.hashCredentials,
};

export class UsersService implements IUserService {
  #cryptoService: ICryptoService;
  #hashService: IHashService;
  #hashPasswordService: IHashPasswordService;
  #usersRepository: IUsersRepository;

  constructor(props: {
    hashService: IHashService;
    cryptoService: ICryptoService;
    hashPasswordService: IHashPasswordService;
    usersRepository: IUsersRepository;
  }) {
    this.#cryptoService = props.cryptoService;
    this.#hashService = props.hashService;
    this.#hashPasswordService = props.hashPasswordService;
    this.#usersRepository = props.usersRepository;
  }

  create(props: { userPlainCreateEntity: UserPlainCreateEntity }) {
    const { contacts } = props.userPlainCreateEntity;

    const contactsHashed = new UserContactsHashedEntity({
      email: contacts.email ? this.#hashService.hash(contacts.email, HASH_CONFIG) : undefined,
      phone: contacts.phone ? this.#hashService.hash(contacts.phone, HASH_CONFIG) : undefined,
    });

    const contactsEncrypted = new UserContactsEncryptedEntity({
      email: contacts.email ? this.#cryptoService.encrypt(contacts.email) : undefined,
      phone: contacts.phone ? this.#cryptoService.encrypt(contacts.phone) : undefined,
    });

    const { passwordPlain } = props.userPlainCreateEntity;
    const passwordHashed = passwordPlain ? this.#hashPasswordService.hashPassword(passwordPlain) : undefined;

    const userCreateEntity = new UserCreateEntity({
      personalInfo: props.userPlainCreateEntity.personalInfo,
      contactsHashed,
      contactsEncrypted,
      passwordHashed,
    });

    return this.#usersRepository.create(userCreateEntity);
  }

  async getUser(props: { userPlainFindEntity: UserPlainFindEntity }): Promise<UserEntity | null> {
    let contactsHashed: UserContactsHashedEntity | undefined;

    if (props.userPlainFindEntity.contactsPlain) {
      const { contactsPlain } = props.userPlainFindEntity;
      contactsHashed = new UserContactsHashedEntity({
        email: contactsPlain.email ? this.#hashService.hash(contactsPlain.email, HASH_CONFIG) : undefined,
        phone: contactsPlain.phone ? this.#hashService.hash(contactsPlain.phone, HASH_CONFIG) : undefined,
      });
    }

    const userFindEntity = new UserFindEntity({
      id: props.userPlainFindEntity.id,
      contactsHashed,
    });

    return this.#usersRepository.findOne(userFindEntity);
  }

  async hasUser(props: { userPlainFindEntity: UserPlainFindEntity }) {
    return !!(await this.getUser(props));
  }

  async patchUser({
    userPlainFindEntity,
    userPlainPatchEntity,
  }: {
    userPlainFindEntity: UserPlainFindEntity;
    userPlainPatchEntity: UserPlainPatchEntity;
  }) {
    let findContactsHashed: UserContactsHashedEntity | undefined;

    if (userPlainFindEntity.contactsPlain) {
      const { contactsPlain } = userPlainFindEntity;
      findContactsHashed = new UserContactsHashedEntity({
        email: contactsPlain.email ? this.#hashService.hash(contactsPlain.email, HASH_CONFIG) : undefined,
        phone: contactsPlain.phone ? this.#hashService.hash(contactsPlain.phone, HASH_CONFIG) : undefined,
      });
    }

    const userFindEntity = new UserFindEntity({
      id: userPlainFindEntity.id,
      contactsHashed: findContactsHashed,
    });

    let userPersonalInfoPatch: UserPersonalInfoPatchEntity | undefined | null = undefined;
    if (userPlainPatchEntity.personalInfo === null) {
      userPersonalInfoPatch = null;
    } else if (typeof userPlainPatchEntity.personalInfo !== 'undefined') {
      userPersonalInfoPatch = new UserPersonalInfoPatchEntity({
        firstName: userPlainPatchEntity.personalInfo.firstName,
        lastName: userPlainPatchEntity.personalInfo.lastName,
      });
    }

    let userContactsHashedPatch: UserContactsHashedPatchEntity | undefined | null = undefined;
    if (userPlainPatchEntity.contacts === null) {
      userContactsHashedPatch = null;
    } else if (typeof userPlainPatchEntity.contacts !== 'undefined') {
      userContactsHashedPatch = new UserContactsHashedPatchEntity({
        email: userPlainPatchEntity.contacts.email
          ? this.#hashService.hash(userPlainPatchEntity.contacts.email, HASH_CONFIG)
          : userPlainPatchEntity.contacts.email,
        phone: userPlainPatchEntity.contacts.phone
          ? this.#hashService.hash(userPlainPatchEntity.contacts.phone, HASH_CONFIG)
          : userPlainPatchEntity.contacts.phone,
      });
    }

    let userContactsEncryptedPatch: UserContactsEncryptedPatchEntity | undefined | null = undefined;
    if (userPlainPatchEntity.contacts === null) {
      userContactsEncryptedPatch = null;
    } else if (typeof userPlainPatchEntity.contacts !== 'undefined') {
      userContactsEncryptedPatch = new UserContactsEncryptedPatchEntity({
        email: userPlainPatchEntity.contacts.email
          ? this.#cryptoService.encrypt(userPlainPatchEntity.contacts.email)
          : userPlainPatchEntity.contacts.email,
        phone: userPlainPatchEntity.contacts.phone
          ? this.#cryptoService.encrypt(userPlainPatchEntity.contacts.phone)
          : userPlainPatchEntity.contacts.phone,
      });
    }

    const passwordHashedPatch =
      userPlainPatchEntity.passwordPlain === null || userPlainPatchEntity.passwordPlain === undefined
        ? userPlainPatchEntity.passwordPlain
        : this.#hashPasswordService.hashPassword(userPlainPatchEntity.passwordPlain);

    const userPatchEntity = new UserPatchEntity({
      personalInfo: userPersonalInfoPatch,
      contactsHashed: userContactsHashedPatch,
      contactsEncrypted: userContactsEncryptedPatch,
      passwordHashed: passwordHashedPatch,
    });

    return await this.#usersRepository.patch({ userFindEntity, userPatchEntity });
  }

  comparePasswords(passwordPlain: string, passwordHashed: string) {
    return this.#hashPasswordService.verifyPassword(passwordPlain, passwordHashed);
  }
}
