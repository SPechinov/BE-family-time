import { IAuthUseCases } from '@/domain/useCases';
import { IAuthRegistrationStore } from '@/domain/repositories/stores';
import { UserContactsPlainEntity, UserPlainCreateEntity, UserPlainFindEntity } from '@/domain/entities';
import { ErrorInvalidCode, ErrorUserExists, generateNumericCode } from '@/pkg';
import { CONFIG } from '@/config';
import { FastifyBaseLogger } from 'fastify';
import { IUserService } from '@/domain/services';

export class AuthUseCases implements IAuthUseCases {
  #authRegistrationStore: IAuthRegistrationStore;
  #usersService: IUserService;

  constructor(props: { authRegistrationStore: IAuthRegistrationStore; usersService: IUserService }) {
    this.#authRegistrationStore = props.authRegistrationStore;
    this.#usersService = props.usersService;
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
      throw new ErrorInvalidCode();
    }

    props.logger.debug('code compare success, saving user');

    const userPlainFindEntity = new UserPlainFindEntity({ contactsPlain: props.userPlainCreateEntity.contacts });
    if (await this.#usersService.hasUser({ userPlainFindEntity })) throw new ErrorUserExists();

    const createdUser = await this.#usersService.create({ userPlainCreateEntity: props.userPlainCreateEntity });

    this.#authRegistrationStore.deleteRegistrationCode({ userContactsPlain: props.userPlainCreateEntity.contacts });

    props.logger.debug(`user saved, id: ${createdUser.id}`);

    return Promise.resolve();
  }
}
