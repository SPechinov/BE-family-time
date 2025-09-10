import { IAuthUseCases } from '@/domain/useCases';
import { IUserRepository } from '@/domain/repositories/db';
import { IAuthRegistrationStore } from '@/domain/repositories/stores';
import { UserContactsPlainEntity, UserPlainCreateEntity } from '@/domain/entities';
import { ErrorInvalidCode, generateNumericCode } from '@/pkg';
import { CONFIG } from '@/config';
import { FastifyBaseLogger } from 'fastify';

export class AuthUseCases implements IAuthUseCases {
  #userRepository: IUserRepository;
  #authRegistrationStore: IAuthRegistrationStore;

  constructor(props: { userRepository: IUserRepository; authRegistrationStore: IAuthRegistrationStore }) {
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

    return Promise.resolve();
  }
}
