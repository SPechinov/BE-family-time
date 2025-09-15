import {
  UserContactsEncryptedEntity,
  UserContactsHashedEntity,
  UserCreateEntity,
  UserPlainCreateEntity,
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
}
