import { IAuthUseCases } from '@/domain/useCases';
import { IAuthForgotPasswordStore, IAuthRegistrationStore } from '@/domain/repositories/stores';
import { UserContactsPlainEntity, UserPlainCreateEntity, UserPlainFindEntity } from '@/domain/entities';
import { ErrorInvalidCode, ErrorUserExists, generateNumericCode } from '@/pkg';
import { CONFIG } from '@/config';
import { FastifyBaseLogger } from 'fastify';
import { IUserService } from '@/domain/services';

export class AuthUseCases implements IAuthUseCases {
  #authRegistrationStore: IAuthRegistrationStore;
  #authForgotPasswordStore: IAuthForgotPasswordStore;
  #usersService: IUserService;

  constructor(props: {
    authRegistrationStore: IAuthRegistrationStore;
    authForgotPasswordStore: IAuthForgotPasswordStore;
    usersService: IUserService;
  }) {
    this.#authRegistrationStore = props.authRegistrationStore;
    this.#authForgotPasswordStore = props.authForgotPasswordStore;
    this.#usersService = props.usersService;
  }

  async registrationStart(props: { userContactsPlainEntity: UserContactsPlainEntity; logger: FastifyBaseLogger }) {
    const code = generateNumericCode(CONFIG.codesLength.registration);
    await this.#authRegistrationStore.saveCode({ userContactsPlain: props.userContactsPlainEntity, code });

    props.logger.debug({ code, contact: props.userContactsPlainEntity.getContact() }, 'code saved');
  }

  async registrationEnd(props: {
    userPlainCreateEntity: UserPlainCreateEntity;
    code: string;
    logger: FastifyBaseLogger;
  }) {
    const storeCode = await this.#authRegistrationStore.getCode({
      userContactsPlain: props.userPlainCreateEntity.contacts,
    });

    if (!storeCode || !props.code || props.code !== storeCode) {
      props.logger.debug({ userCode: props.code, storeCode }, 'invalid code');
      throw new ErrorInvalidCode();
    }

    props.logger.debug(
      { contact: props.userPlainCreateEntity.contacts.getContact() },
      'code compare success, saving user',
    );

    const userPlainFindEntity = new UserPlainFindEntity({ contactsPlain: props.userPlainCreateEntity.contacts });
    if (await this.#usersService.hasUser({ userPlainFindEntity })) throw new ErrorUserExists();

    const createdUser = await this.#usersService.create({ userPlainCreateEntity: props.userPlainCreateEntity });

    this.#authRegistrationStore.deleteCode({ userContactsPlain: props.userPlainCreateEntity.contacts });

    props.logger.debug(`user saved, id: ${createdUser.id}`);
  }

  async forgotPasswordStart(props: { userContactsPlainEntity: UserContactsPlainEntity; logger: FastifyBaseLogger }) {
    const userPlainFindEntity = new UserPlainFindEntity({ contactsPlain: props.userContactsPlainEntity });
    const hasUser = await this.#usersService.hasUser({ userPlainFindEntity });

    if (!hasUser) {
      props.logger.debug({ contact: props.userContactsPlainEntity.getContact() }, 'user not exists');
      return;
    }

    const code = generateNumericCode(CONFIG.codesLength.forgotPassword);
    await this.#authForgotPasswordStore.saveCode({ userContactsPlain: props.userContactsPlainEntity, code });

    props.logger.debug({ code, contact: props.userContactsPlainEntity.getContact() }, 'code saved');
  }
}
