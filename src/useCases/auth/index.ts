import { IAuthUseCases } from '@/domain/useCases';
import { IUserRepository } from '@/domain/repositories/db';
import { IAuthRegistrationStore } from '@/domain/repositories/stores';
import {
  UserContactsEncryptedEntity,
  UserContactsHashedEntity,
  UserContactsPlainEntity,
  UserCreateEntity,
  UserPlainCreateEntity,
} from '@/domain/entities';
import { ErrorInvalidCode, generateNumericCode } from '@/pkg';
import { CONFIG } from '@/config';
import { FastifyBaseLogger } from 'fastify';
import { ICryptoCredentialsService, IHashService } from '@/domain/services';

export class AuthUseCases implements IAuthUseCases {
  #hashService: IHashService;
  #cryptoCredentialsService: ICryptoCredentialsService;
  #userRepository: IUserRepository;
  #authRegistrationStore: IAuthRegistrationStore;

  constructor(props: {
    hashService: IHashService;
    cryptoCredentialsService: ICryptoCredentialsService;
    userRepository: IUserRepository;
    authRegistrationStore: IAuthRegistrationStore;
  }) {
    this.#hashService = props.hashService;
    this.#cryptoCredentialsService = props.cryptoCredentialsService;
    this.#userRepository = props.userRepository;
    this.#authRegistrationStore = props.authRegistrationStore;
  }

  async registrationBegin(props: { userContactsPlainEntity: UserContactsPlainEntity; logger: FastifyBaseLogger }) {
    const code = generateNumericCode(CONFIG.codesLength.registration);
    await this.#authRegistrationStore.saveRegistrationCode({ userContactsPlain: props.userContactsPlainEntity, code });

    props.logger.debug({ code, contact: props.userContactsPlainEntity.getContact() }, 'code saved');

    return Promise.resolve();
  }

  async registrationEnd(props: {
    userPlainCreateEntity: UserPlainCreateEntity;
    code: string;
    logger: FastifyBaseLogger;
  }) {
    const storeCode = await this.#authRegistrationStore.getRegistrationCode({
      userContactsPlain: props.userPlainCreateEntity.contacts,
    });

    if (!storeCode || !props.code || props.code !== storeCode) {
      props.logger.debug({ userCode: props.code, storeCode }, 'invalid code');
      throw ErrorInvalidCode.new();
    }

    props.logger.debug('code compare success, saving user');

    const contactsHashed = new UserContactsHashedEntity({
      email: props.userPlainCreateEntity.contacts.email
        ? this.#hashService.hashEmail(props.userPlainCreateEntity.contacts.email)
        : undefined,
      phone: props.userPlainCreateEntity.contacts.phone
        ? this.#hashService.hashPhone(props.userPlainCreateEntity.contacts.phone)
        : undefined,
    });

    const contactsEncrypted = new UserContactsEncryptedEntity({
      email: props.userPlainCreateEntity.contacts.email
        ? this.#cryptoCredentialsService.encryptEmail(props.userPlainCreateEntity.contacts.email)
        : undefined,
      phone: props.userPlainCreateEntity.contacts.phone
        ? this.#cryptoCredentialsService.encryptPhone(props.userPlainCreateEntity.contacts.phone)
        : undefined,
    });

    const userCreateEntity = new UserCreateEntity({
      personalInfo: props.userPlainCreateEntity.personalInfo,
      contactsHashed,
      contactsEncrypted,
      passwordHashed: props.userPlainCreateEntity.passwordPlain,
    });

    return Promise.resolve();
  }
}
