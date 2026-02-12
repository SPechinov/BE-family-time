import { CONFIG } from '@/config';
import { IJwtService, IOtpCodesService, IRateLimiterService, IUsersService } from '@/domains/services';
import { IAuthUseCases } from '@/domains/useCases';
import {
  UserContactsPlainEntity,
  UserCreatePlainEntity,
  UserEntity,
  UserFindOnePlainEntity,
  UserPasswordPlainEntity,
  UserPatchOnePlainEntity,
} from '@/entities';
import {
  ErrorInvalidCode,
  ErrorInvalidContacts,
  ErrorUserNotExists,
  ErrorUserExists,
  generateNumericCode,
  ErrorDoubleRegistration,
  ILogger,
  ErrorInvalidLoginOrPassword,
} from '@/pkg';
import { IRefreshTokensStore } from '@/domains/repositories/stores';

export class AuthUseCases implements IAuthUseCases {
  readonly #userService: IUsersService;
  readonly #registrationOtpCodesService: IOtpCodesService;
  readonly #forgotPasswordOtpCodesService: IOtpCodesService;
  readonly #registrationStartRateLimiterService: IRateLimiterService;
  readonly #registrationEndRateLimiterService: IRateLimiterService;
  readonly #forgotPasswordStartRateLimiterService: IRateLimiterService;
  readonly #forgotPasswordEndRateLimiterService: IRateLimiterService;
  readonly #refreshTokensStore: IRefreshTokensStore;
  readonly #jwtService: IJwtService;
  readonly #pendRegistrationEndRequests = new Set<string>();

  constructor(props: {
    usersService: IUsersService;
    registrationOtpCodesService: IOtpCodesService;
    forgotPasswordOtpCodesService: IOtpCodesService;
    registrationStartRateLimiterService: IRateLimiterService;
    registrationEndRateLimiterService: IRateLimiterService;
    forgotPasswordStartRateLimiterService: IRateLimiterService;
    forgotPasswordEndRateLimiterService: IRateLimiterService;
    refreshTokensStore: IRefreshTokensStore;
    jwtService: IJwtService;
  }) {
    this.#userService = props.usersService;
    this.#registrationOtpCodesService = props.registrationOtpCodesService;
    this.#forgotPasswordOtpCodesService = props.forgotPasswordOtpCodesService;
    this.#registrationStartRateLimiterService = props.registrationStartRateLimiterService;
    this.#registrationEndRateLimiterService = props.registrationEndRateLimiterService;
    this.#forgotPasswordStartRateLimiterService = props.forgotPasswordStartRateLimiterService;
    this.#forgotPasswordEndRateLimiterService = props.forgotPasswordEndRateLimiterService;
    this.#refreshTokensStore = props.refreshTokensStore;
    this.#jwtService = props.jwtService;
  }

  async login(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    userPasswordPlainEntity: UserPasswordPlainEntity;
    logger: ILogger;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    this.#getContactOrThrow(props.userContactsPlainEntity);
    const user = await this.#userService.findOne({
      userFindOnePlainEntity: new UserFindOnePlainEntity({ contactsPlain: props.userContactsPlainEntity }),
    });

    if (!user || !user.passwordHashed) throw new ErrorInvalidLoginOrPassword();
    const verified = this.#userService.verifyPassword({
      logger: props.logger,
      password: props.userPasswordPlainEntity.password,
      hash: user.passwordHashed.password,
    });
    if (!verified) throw new ErrorInvalidLoginOrPassword();

    const accessToken = this.#jwtService.generateAccessToken({ userId: user.id });
    const refreshToken = this.#jwtService.generateRefreshToken({ userId: user.id });

    await this.#refreshTokensStore.save({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + CONFIG.jwt.refreshTokenExpiry),
    });

    return { accessToken, refreshToken };
  }

  async registrationStart(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    logger: ILogger;
  }): Promise<{ otpCode: string }> {
    const contact = this.#getContactOrThrow(props.userContactsPlainEntity);

    await this.#registrationStartRateLimiterService.checkLimitOrThrow({ key: contact });

    const otpCode = generateNumericCode(CONFIG.codesLength.registration);
    await this.#registrationOtpCodesService.saveCode({ key: contact, code: otpCode });
    props.logger.debug({ otpCode, contact }, 'registration code saved');

    return { otpCode };
  }

  async registrationEnd(props: {
    userCreatePlainEntity: UserCreatePlainEntity;
    otpCode: string;
    logger: ILogger;
  }): Promise<UserEntity> {
    const contact = this.#getContactOrThrow(props.userCreatePlainEntity.contactsPlain);

    if (this.#pendRegistrationEndRequests.has(contact)) throw new ErrorDoubleRegistration();

    try {
      this.#pendRegistrationEndRequests.add(contact);
      await this.#registrationEndRateLimiterService.checkLimitOrThrow({ key: contact });

      const storeOtpCode = await this.#registrationOtpCodesService.getCode({ key: contact });
      this.#compareOtpCodes(storeOtpCode, props.otpCode);
      this.#registrationOtpCodesService.deleteCode({ key: contact }).catch((error = {}) => {
        props.logger.error({ error }, 'code did not deleted');
      });

      const userFindOnePlainEntity = new UserFindOnePlainEntity({
        contactsPlain: props.userCreatePlainEntity.contactsPlain,
      });
      const foundUser = await this.#userService.findOne({ userFindOnePlainEntity });
      if (foundUser) throw new ErrorUserExists();

      const createdUser = await this.#userService.createOne({ userCreatePlainEntity: props.userCreatePlainEntity });
      props.logger.debug({ contact }, 'user created');

      return createdUser;
    } finally {
      this.#pendRegistrationEndRequests.delete(contact);
    }
  }

  async forgotPasswordStart(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    logger: ILogger;
  }): Promise<{ otpCode: string }> {
    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    await this.#forgotPasswordStartRateLimiterService.checkLimitOrThrow({ key: contact });

    const userFindOnePlainEntity = new UserFindOnePlainEntity({ contactsPlain: props.userContactsPlainEntity });
    const foundUser = await this.#userService.findOne({ userFindOnePlainEntity });
    if (!foundUser) throw new ErrorUserNotExists();

    const otpCode = generateNumericCode(CONFIG.codesLength.forgotPassword);
    await this.#forgotPasswordOtpCodesService.saveCode({ key: contact, code: otpCode });
    props.logger.debug({ otpCode, contact }, 'code saved');

    return { otpCode };
  }

  async forgotPasswordEnd(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    password: UserPasswordPlainEntity;
    otpCode: string;
    logger: ILogger;
  }): Promise<UserEntity> {
    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    await this.#forgotPasswordEndRateLimiterService.checkLimitOrThrow({ key: contact });

    const storeOtpCode = await this.#forgotPasswordOtpCodesService.getCode({ key: contact });
    this.#compareOtpCodes(storeOtpCode, props.otpCode);
    this.#forgotPasswordOtpCodesService.deleteCode({ key: contact }).catch((error = {}) => {
      props.logger.error({ error }, 'code did not deleted');
    });

    const user = await this.#userService.patchOne({
      userFindOnePlainEntity: new UserFindOnePlainEntity({ contactsPlain: props.userContactsPlainEntity }),
      userPatchOnePlainEntity: new UserPatchOnePlainEntity({
        passwordPlain: props.password,
      }),
    });

    props.logger.debug({ contact }, 'code compare success, password updated');

    return user;
  }

  #compareOtpCodes(storeOtpCode: string | null | undefined, userOtpCode: string | null | undefined) {
    if (!storeOtpCode || !userOtpCode || storeOtpCode !== userOtpCode) throw new ErrorInvalidCode();
  }

  #getContactOrThrow(userContactsPlainEntity?: UserContactsPlainEntity): string {
    const contact = userContactsPlainEntity?.getContact();
    if (!contact) throw new ErrorInvalidContacts();
    return contact;
  }
}
