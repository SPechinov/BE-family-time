import { CONFIG } from '@/config';
import { IOtpCodesService, IRateLimiterService, IUsersService } from '@/domains/services';
import { IAuthUseCases } from '@/domains/useCases';
import { UserContactsPlainEntity, UserCreatePlainEntity, UserEntity, UserFindOnePlainEntity } from '@/entities';
import { ErrorInvalidCode, ErrorInvalidContacts, ErrorUserExists, generateNumericCode } from '@/pkg';
import { FastifyBaseLogger } from 'fastify';

export class AuthUseCases implements IAuthUseCases {
  readonly #userService: IUsersService;
  readonly #registrationOtpCodesService: IOtpCodesService;
  readonly #registrationRateLimiterService: IRateLimiterService;

  constructor(props: {
    userService: IUsersService;
    registrationOtpCodesService: IOtpCodesService;
    registrationRateLimiterService: IRateLimiterService;
  }) {
    this.#userService = props.userService;
    this.#registrationOtpCodesService = props.registrationOtpCodesService;
    this.#registrationRateLimiterService = props.registrationRateLimiterService;
  }

  async registrationStart(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    logger: FastifyBaseLogger;
  }): Promise<{ otpCode: string }> {
    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();

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

    await this.#registrationRateLimiterService.checkLimitOrThrow({ key: contact });

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

    return new UserEntity({ id: '', createdAt: new Date(), updatedAt: new Date() });
  }
}
