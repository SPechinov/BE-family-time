import { IAuthUseCases } from '@/domain/useCases';
import {
  UserContactsPlainEntity,
  UserPlainCreateEntity,
  UserPlainFindEntity,
  UserPlainPatchEntity,
} from '@/domain/entities';
import { ErrorInvalidCode, ErrorInvalidContacts, ErrorUserExists, generateNumericCode } from '@/pkg';
import { CONFIG } from '@/config';
import { FastifyBaseLogger } from 'fastify';
import { IOtpCodesService, IRateLimiterService, IUserService } from '@/domain/services';

export class AuthUseCases implements IAuthUseCases {
  #registrationOtpStore: IOtpCodesService;
  #registrationRateLimiterService: IRateLimiterService;
  #forgotPasswordOtpStore: IOtpCodesService;
  #forgotPasswordRateLimiterService: IRateLimiterService;
  #usersService: IUserService;

  constructor(props: {
    registrationOtpStore: IOtpCodesService;
    registrationRateLimiterService: IRateLimiterService;
    forgotPasswordOtpStore: IOtpCodesService;
    forgotPasswordRateLimiterService: IRateLimiterService;
    usersService: IUserService;
  }) {
    this.#registrationOtpStore = props.registrationOtpStore;
    this.#registrationRateLimiterService = props.registrationRateLimiterService;
    this.#forgotPasswordOtpStore = props.forgotPasswordOtpStore;
    this.#forgotPasswordRateLimiterService = props.forgotPasswordRateLimiterService;
    this.#usersService = props.usersService;
  }

  async registrationStart(props: { userContactsPlainEntity: UserContactsPlainEntity; logger: FastifyBaseLogger }) {
    const code = generateNumericCode(CONFIG.codesLength.registration);
    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();
    await this.#registrationOtpStore.saveCode({ key: contact, code });

    props.logger.debug({ code, contact: props.userContactsPlainEntity.getContact() }, 'code saved');
  }

  async registrationEnd(props: {
    userPlainCreateEntity: UserPlainCreateEntity;
    code: string;
    logger: FastifyBaseLogger;
  }) {
    const contact = props.userPlainCreateEntity.contacts.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    await this.#registrationRateLimiterService.checkLimit({ key: contact });

    const storeCode = await this.#registrationOtpStore.getCode({
      key: contact,
    });

    if (!storeCode || !props.code || props.code !== storeCode) {
      props.logger.debug({ userCode: props.code, storeCode }, 'invalid code');
      throw new ErrorInvalidCode();
    }

    await this.#registrationOtpStore.deleteCode({ key: contact });

    props.logger.debug({ contact }, 'code compare success, saving user');

    const userPlainFindEntity = new UserPlainFindEntity({ contactsPlain: props.userPlainCreateEntity.contacts });
    if (await this.#usersService.hasUser({ userPlainFindEntity })) throw new ErrorUserExists();

    const createdUser = await this.#usersService.create({ userPlainCreateEntity: props.userPlainCreateEntity });

    props.logger.debug(`user saved, id: ${createdUser.id}`);
  }

  async forgotPasswordStart(props: { userContactsPlainEntity: UserContactsPlainEntity; logger: FastifyBaseLogger }) {
    const userPlainFindEntity = new UserPlainFindEntity({ contactsPlain: props.userContactsPlainEntity });
    const hasUser = await this.#usersService.hasUser({ userPlainFindEntity });

    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    if (!hasUser) {
      props.logger.debug({ contact }, 'user not exists');
      return;
    }

    const code = generateNumericCode(CONFIG.codesLength.forgotPassword);
    await this.#forgotPasswordOtpStore.saveCode({ key: contact, code });

    props.logger.debug({ code, contact }, 'code saved');
  }

  async forgotPasswordEnd(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    userPlainPatchEntity: UserPlainPatchEntity;
    code: string;
    logger: FastifyBaseLogger;
  }) {
    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    await this.#forgotPasswordRateLimiterService.checkLimit({ key: contact });

    const storeCode = await this.#forgotPasswordOtpStore.getCode({
      key: contact,
    });

    if (!storeCode || !props.code || props.code !== storeCode) {
      props.logger.debug({ userCode: props.code, storeCode }, 'invalid code');
      throw new ErrorInvalidCode();
    }

    await this.#forgotPasswordOtpStore.deleteCode({ key: contact });

    await this.#usersService.patchUser({
      userPlainFindEntity: new UserPlainFindEntity({ contactsPlain: props.userContactsPlainEntity }),
      userPlainPatchEntity: new UserPlainPatchEntity({
        passwordPlain: props.userPlainPatchEntity.passwordPlain,
      }),
    });

    props.logger.debug({ contact }, 'password changed');
  }
}
