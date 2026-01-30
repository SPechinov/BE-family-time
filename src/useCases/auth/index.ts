import { CONFIG } from '@/config';
import { IOtpCodesService, IRateLimiterService, IUsersService } from '@/domains/services';
import { IAuthUseCases } from '@/domains/useCases';
import { UserContactsPlainEntity, UserCreatePlainEntity, UserEntity, UserFindOnePlainEntity } from '@/entities';
import {
  ErrorInvalidCode,
  ErrorInvalidContacts,
  ErrorNotUserExists,
  ErrorUserExists,
  generateNumericCode,
} from '@/pkg';
import { FastifyBaseLogger } from 'fastify';

export class AuthUseCases implements IAuthUseCases {
  readonly #userService: IUsersService;
  readonly #registrationOtpCodesService: IOtpCodesService;
  readonly #forgotPasswordOtpCodesService: IOtpCodesService;
  readonly #registrationStartRateLimiterService: IRateLimiterService;
  readonly #registrationEndRateLimiterService: IRateLimiterService;
  readonly #forgotPasswordStartRateLimiterService: IRateLimiterService;
  readonly #forgotPasswordEndRateLimiterService: IRateLimiterService;

  constructor(props: {
    userService: IUsersService;
    registrationOtpCodesService: IOtpCodesService;
    forgotPasswordOtpCodesService: IOtpCodesService;
    registrationStartRateLimiterService: IRateLimiterService;
    registrationEndRateLimiterService: IRateLimiterService;
    forgotPasswordStartRateLimiterService: IRateLimiterService;
    forgotPasswordEndRateLimiterService: IRateLimiterService;
  }) {
    this.#userService = props.userService;
    this.#registrationOtpCodesService = props.registrationOtpCodesService;
    this.#forgotPasswordOtpCodesService = props.forgotPasswordOtpCodesService;
    this.#registrationStartRateLimiterService = props.registrationStartRateLimiterService;
    this.#registrationEndRateLimiterService = props.registrationEndRateLimiterService;
    this.#forgotPasswordStartRateLimiterService = props.forgotPasswordStartRateLimiterService;
    this.#forgotPasswordEndRateLimiterService = props.forgotPasswordEndRateLimiterService;
  }

  async registrationStart(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    logger: FastifyBaseLogger;
  }): Promise<{ otpCode: string }> {
    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    await this.#registrationStartRateLimiterService.checkLimitOrThrow({ key: contact });

    const otpCode = generateNumericCode(CONFIG.codesLength.registration);
    await this.#registrationOtpCodesService.saveCode({ key: contact, code: otpCode });

    props.logger.debug({ otpCode, contact }, 'code saved');
    return { otpCode };
  }

  async registrationEnd(props: {
    userCreatePlainEntity: UserCreatePlainEntity;
    otpCode: string;
    logger: FastifyBaseLogger;
  }): Promise<UserEntity> {
    const contact = props.userCreatePlainEntity.contactsPlain?.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    await this.#registrationEndRateLimiterService.checkLimitOrThrow({ key: contact });

    const storeOtpCode = await this.#registrationOtpCodesService.getCode({ key: contact });

    if (!storeOtpCode || !props.otpCode || storeOtpCode !== props.otpCode) {
      props.logger.debug({ userOtpCode: props.otpCode, storeOtpCode }, 'invalid code');
      throw new ErrorInvalidCode();
    }

    this.#registrationOtpCodesService.deleteCode({ key: contact });

    props.logger.debug({ contact }, 'code compare success, saving user');

    const userFindOnePlainEntity = new UserFindOnePlainEntity({
      contactsPlain: props.userCreatePlainEntity.contactsPlain,
    });
    const foundUser = await this.#userService.findUser({ userFindOnePlainEntity });
    if (foundUser) throw new ErrorUserExists();

    const createdUser = await this.#userService.create({ userCreatePlainEntity: props.userCreatePlainEntity });
    return createdUser;
  }

  async forgotPasswordStart(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    logger: FastifyBaseLogger;
  }): Promise<{ otpCode: string }> {
    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    const userFindOnePlainEntity = new UserFindOnePlainEntity({ contactsPlain: props.userContactsPlainEntity });
    const foundUser = await this.#userService.findUser({ userFindOnePlainEntity });
    if (!foundUser) {
      props.logger.debug({ contact }, 'user not found');
      throw new ErrorNotUserExists();
    }

    const otpCode = generateNumericCode(CONFIG.codesLength.forgotPassword);
    await this.#forgotPasswordOtpCodesService.saveCode({ key: contact, code: otpCode });

    props.logger.debug({ otpCode, contact }, 'code saved');

    return { otpCode };
  }

  async forgotPasswordEnd(props: {
    userCreatePlainEntity: UserCreatePlainEntity;
    otpCode: string;
    logger: FastifyBaseLogger;
  }): Promise<UserEntity> {
    return new UserEntity();
  }
}
