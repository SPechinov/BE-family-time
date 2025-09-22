import { IAuthUseCases } from '@/domain/useCases';
import {
  UserContactsPlainEntity,
  UserPlainCreateEntity,
  UserPlainFindEntity,
  UserPlainPatchEntity,
} from '@/domain/entities';
import {
  ErrorInvalidCode,
  ErrorInvalidContacts,
  ErrorInvalidLoginOrPassword,
  ErrorInvalidRefreshToken,
  ErrorUserExists,
  generateNumericCode,
} from '@/pkg';
import { CONFIG } from '@/config';
import { FastifyBaseLogger } from 'fastify';
import {
  IJwtService,
  IOtpCodesService,
  IRateLimiterService,
  IRefreshTokenStoreService,
  IUserService,
} from '@/domain/services';

export class AuthUseCases implements IAuthUseCases {
  #registrationOtpService: IOtpCodesService;
  #registrationRateLimiterService: IRateLimiterService;
  #forgotPasswordOtpService: IOtpCodesService;
  #forgotPasswordRateLimiterService: IRateLimiterService;
  #usersService: IUserService;
  #jwtService: IJwtService;
  #refreshTokenStoreService: IRefreshTokenStoreService;

  constructor(props: {
    registrationOtpService: IOtpCodesService;
    registrationRateLimiterService: IRateLimiterService;
    forgotPasswordOtpService: IOtpCodesService;
    forgotPasswordRateLimiterService: IRateLimiterService;
    usersService: IUserService;
    jwtService: IJwtService;
    refreshTokenStoreService: IRefreshTokenStoreService;
  }) {
    this.#registrationOtpService = props.registrationOtpService;
    this.#registrationRateLimiterService = props.registrationRateLimiterService;
    this.#forgotPasswordOtpService = props.forgotPasswordOtpService;
    this.#forgotPasswordRateLimiterService = props.forgotPasswordRateLimiterService;
    this.#jwtService = props.jwtService;
    this.#refreshTokenStoreService = props.refreshTokenStoreService;
    this.#usersService = props.usersService;
  }

  async login(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    passwordPlain: string;
    logger: FastifyBaseLogger;
  }) {
    const contact = this.#getContactOrThrow(props.userContactsPlainEntity);
    props.logger.debug({ contact }, 'login start');

    const user = await this.#usersService.getUser({
      userPlainFindEntity: new UserPlainFindEntity({
        contactsPlain: props.userContactsPlainEntity,
      }),
    });
    if (!user || !user.passwordHashed || !props.passwordPlain) throw new ErrorInvalidLoginOrPassword();

    if (!this.#usersService.comparePasswords(props.passwordPlain, user.passwordHashed)) {
      props.logger.debug({ password: props.passwordPlain }, 'passwords are not equal, login failed');
      throw new ErrorInvalidLoginOrPassword();
    }

    const accessToken = this.#jwtService.generateAccessToken({ userId: user.id });
    const refreshToken = this.#jwtService.generateRefreshToken({ userId: user.id });

    const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.#refreshTokenStoreService.saveRefreshToken({
      userId: user.id,
      refreshToken,
      expiresAt: refreshTokenExpiry,
    });

    props.logger.debug({ userId: user.id }, 'login successful');

    return { accessToken, refreshToken };
  }

  async refreshToken(props: { refreshToken: string; logger: FastifyBaseLogger }) {
    const decoded = this.#jwtService.verifyRefreshToken(props.refreshToken);
    if (!decoded) throw new ErrorInvalidRefreshToken();

    const isValid = await this.#refreshTokenStoreService.isRefreshTokenValid({
      userId: decoded.userId,
      refreshToken: props.refreshToken,
    });

    if (!isValid) throw new ErrorInvalidRefreshToken();

    await this.#refreshTokenStoreService.deleteRefreshToken({
      userId: decoded.userId,
      refreshToken: props.refreshToken,
    });

    const accessToken = this.#jwtService.generateAccessToken({ userId: decoded.userId });
    const newRefreshToken = this.#jwtService.generateRefreshToken({ userId: decoded.userId });

    const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.#refreshTokenStoreService.saveRefreshToken({
      userId: decoded.userId,
      refreshToken: newRefreshToken,
      expiresAt: refreshTokenExpiry,
    });

    props.logger.debug('token refreshed');

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(props: { refreshToken: string; logger: FastifyBaseLogger }) {
    const decoded = this.#jwtService.verifyRefreshToken(props.refreshToken);
    if (!decoded) return;

    await this.#refreshTokenStoreService.deleteRefreshToken({
      userId: decoded.userId,
      refreshToken: props.refreshToken,
    });

    props.logger.debug('user logged out');
  }

  async logoutAll(props: { userId: string; logger: FastifyBaseLogger }) {
    await this.#refreshTokenStoreService.deleteAllUserRefreshTokens({
      userId: props.userId,
    });

    props.logger.debug('user logged out from all devices');
  }

  async registrationStart(props: { userContactsPlainEntity: UserContactsPlainEntity; logger: FastifyBaseLogger }) {
    const contact = this.#getContactOrThrow(props.userContactsPlainEntity);

    const code = generateNumericCode(CONFIG.codesLength.registration);
    await this.#registrationOtpService.saveCode({ key: contact, code });

    props.logger.debug({ code, contact }, 'code saved');
  }

  async registrationEnd(props: {
    userPlainCreateEntity: UserPlainCreateEntity;
    code: string;
    logger: FastifyBaseLogger;
  }) {
    const contact = this.#getContactOrThrow(props.userPlainCreateEntity.contacts);

    await this.#registrationRateLimiterService.checkLimit({ key: contact });

    const storeCode = await this.#registrationOtpService.getCode({
      key: contact,
    });

    if (!storeCode || !props.code || props.code !== storeCode) {
      props.logger.debug({ userCode: props.code, storeCode }, 'invalid code');
      throw new ErrorInvalidCode();
    }

    await this.#registrationOtpService.deleteCode({ key: contact });

    props.logger.debug({ contact }, 'code compare success, saving user');

    const userPlainFindEntity = new UserPlainFindEntity({ contactsPlain: props.userPlainCreateEntity.contacts });
    if (await this.#usersService.hasUser({ userPlainFindEntity })) throw new ErrorUserExists();

    const createdUser = await this.#usersService.create({ userPlainCreateEntity: props.userPlainCreateEntity });

    props.logger.debug(`user saved, id: ${createdUser.id}`);
  }

  async forgotPasswordStart(props: { userContactsPlainEntity: UserContactsPlainEntity; logger: FastifyBaseLogger }) {
    const contact = this.#getContactOrThrow(props.userContactsPlainEntity);

    const userPlainFindEntity = new UserPlainFindEntity({ contactsPlain: props.userContactsPlainEntity });
    const hasUser = await this.#usersService.hasUser({ userPlainFindEntity });

    if (!hasUser) {
      props.logger.debug({ contact }, 'user not exists');
      return;
    }

    const code = generateNumericCode(CONFIG.codesLength.forgotPassword);
    await this.#forgotPasswordOtpService.saveCode({ key: contact, code });

    props.logger.debug({ code, contact }, 'code saved');
  }

  async forgotPasswordEnd(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    userPlainPatchEntity: UserPlainPatchEntity;
    code: string;
    logger: FastifyBaseLogger;
  }) {
    const contact = this.#getContactOrThrow(props.userContactsPlainEntity);

    await this.#forgotPasswordRateLimiterService.checkLimit({ key: contact });

    const storeCode = await this.#forgotPasswordOtpService.getCode({
      key: contact,
    });

    if (!storeCode || !props.code || props.code !== storeCode) {
      props.logger.debug({ userCode: props.code, storeCode }, 'invalid code');
      throw new ErrorInvalidCode();
    }

    await this.#forgotPasswordOtpService.deleteCode({ key: contact });

    await this.#usersService.patchUser({
      userPlainFindEntity: new UserPlainFindEntity({ contactsPlain: props.userContactsPlainEntity }),
      userPlainPatchEntity: new UserPlainPatchEntity({
        passwordPlain: props.userPlainPatchEntity.passwordPlain,
      }),
    });

    props.logger.debug({ contact }, 'password changed');
  }

  #getContactOrThrow(userContactsPlainEntity: UserContactsPlainEntity): string {
    const contact = userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();
    return contact;
  }
}
