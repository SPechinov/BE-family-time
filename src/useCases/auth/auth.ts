import { CONFIG } from '@/config';
import { IJwtService, IRateLimiterService, IUsersService } from '@/domains/services';
import { DefaultProps, IAuthUseCases } from '@/domains/useCases';
import { IOtpCodesStore } from '@/domains/repositories/stores';
import {
  UserContactsPlainEntity,
  UserCreatePlainEntity,
  UserFindOnePlainEntity,
  UserEntity,
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
  ErrorInvalidLoginOrPassword,
  ErrorUnauthorized,
} from '@/pkg';
import { IRefreshTokensStore } from '@/domains/repositories/stores';
import { JwtPayload } from 'jsonwebtoken';
import { UUID } from 'node:crypto';

export class AuthUseCases implements IAuthUseCases {
  readonly #userService: IUsersService;
  readonly #registrationOtpCodesStore: IOtpCodesStore;
  readonly #forgotPasswordOtpCodesStore: IOtpCodesStore;
  readonly #refreshTokensStore: IRefreshTokensStore;
  readonly #jwtService: IJwtService;
  readonly #rateLimiter: IRateLimiterService;
  readonly #pendRegistrationEndRequests = new Set<string>();

  constructor(props: {
    usersService: IUsersService;
    registrationOtpCodesStore: IOtpCodesStore;
    forgotPasswordOtpCodesStore: IOtpCodesStore;
    rateLimiter: IRateLimiterService;
    refreshTokensStore: IRefreshTokensStore;
    jwtService: IJwtService;
  }) {
    this.#userService = props.usersService;
    this.#registrationOtpCodesStore = props.registrationOtpCodesStore;
    this.#forgotPasswordOtpCodesStore = props.forgotPasswordOtpCodesStore;
    this.#refreshTokensStore = props.refreshTokensStore;
    this.#rateLimiter = props.rateLimiter;
    this.#jwtService = props.jwtService;
  }

  async login(
    props: DefaultProps<{
      userContactsPlainEntity: UserContactsPlainEntity;
      userPasswordPlainEntity: UserPasswordPlainEntity;
      jwtPayload?: Record<string, string>;
    }>,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const contact = this.#getContactOrThrow(props.userContactsPlainEntity);

    await this.#rateLimiter.checkLimitOrThrow({ key: contact });

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

    const jwtPayload = { userId: user.id, ...(props.jwtPayload ?? {}) };
    const accessToken = this.#jwtService.generateAccessToken(jwtPayload);
    const refreshToken = this.#jwtService.generateRefreshToken(jwtPayload);

    await this.#refreshTokensStore.save({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + CONFIG.jwt.refreshTokenExpiry),
    });

    return { accessToken, refreshToken };
  }

  async registrationStart(
    props: DefaultProps<{ userContactsPlainEntity: UserContactsPlainEntity }>,
  ): Promise<{ otpCode: string }> {
    const contact = this.#getContactOrThrow(props.userContactsPlainEntity);

    await this.#rateLimiter.checkLimitOrThrow({ key: contact });

    const otpCode = generateNumericCode(CONFIG.codesLength.registration);
    await this.#registrationOtpCodesStore.set({ key: contact, code: otpCode });
    props.logger.debug({ otpCode, contact }, 'registration code saved');

    return { otpCode };
  }

  async registrationEnd(
    props: DefaultProps<{ userCreatePlainEntity: UserCreatePlainEntity; otpCode: string }>,
  ): Promise<UserEntity> {
    const contact = this.#getContactOrThrow(props.userCreatePlainEntity.contactsPlain);

    if (this.#pendRegistrationEndRequests.has(contact)) throw new ErrorDoubleRegistration();

    try {
      this.#pendRegistrationEndRequests.add(contact);
      await this.#rateLimiter.checkLimitOrThrow({ key: contact });

      const storeOtpCode = await this.#registrationOtpCodesStore.get({ key: contact });
      this.#compareOtpCodes(storeOtpCode, props.otpCode);
      this.#registrationOtpCodesStore.delete({ key: contact }).catch((error = {}) => {
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

  async forgotPasswordStart(
    props: DefaultProps<{ userContactsPlainEntity: UserContactsPlainEntity }>,
  ): Promise<{ otpCode: string }> {
    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    await this.#rateLimiter.checkLimitOrThrow({ key: contact });

    const userFindOnePlainEntity = new UserFindOnePlainEntity({ contactsPlain: props.userContactsPlainEntity });
    const foundUser = await this.#userService.findOne({ userFindOnePlainEntity });
    if (!foundUser) throw new ErrorUserNotExists();

    const otpCode = generateNumericCode(CONFIG.codesLength.forgotPassword);
    await this.#forgotPasswordOtpCodesStore.set({ key: contact, code: otpCode });
    props.logger.debug({ otpCode, contact }, 'code saved');

    return { otpCode };
  }

  async forgotPasswordEnd(
    props: DefaultProps<{
      userContactsPlainEntity: UserContactsPlainEntity;
      password: UserPasswordPlainEntity;
      otpCode: string;
    }>,
  ): Promise<UserEntity> {
    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    await this.#rateLimiter.checkLimitOrThrow({ key: contact });

    const storeOtpCode = await this.#forgotPasswordOtpCodesStore.get({ key: contact });
    this.#compareOtpCodes(storeOtpCode, props.otpCode);
    this.#forgotPasswordOtpCodesStore.delete({ key: contact }).catch((error = {}) => {
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

  async getAllSessionsPayloads(
    props: DefaultProps<{
      userId: UUID;
    }>,
  ): Promise<{ payload: JwtPayload | string | null; jwt: string }[]> {
    const jwts = await this.#refreshTokensStore.getAllByUserId({ userId: props.userId });
    return jwts.map((jwt) => ({
      jwt,
      payload: this.#jwtService.parseToken(jwt),
    }));
  }

  async logoutAllSessions(props: DefaultProps<{ userId: UUID }>): Promise<void> {
    await this.#refreshTokensStore.deleteAll({ userId: props.userId });
  }

  async logoutSession(props: DefaultProps<{ userId: UUID; refreshToken: string }>): Promise<void> {
    await this.#refreshTokensStore.delete({ userId: props.userId, refreshToken: props.refreshToken });
  }

  async refreshTokens(
    props: DefaultProps<{
      refreshToken: string;
      jwtPayload?: Record<string, string>;
    }>,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const oldJwtPayload = this.#jwtService.verifyRefreshToken(props.refreshToken);
    if (!oldJwtPayload?.userId) {
      props.logger.warn({ jwtRefreshToken: props.refreshToken }, 'refresh token invalid payload');
      throw new ErrorUnauthorized();
    }

    const hasJwtInStore = await this.#refreshTokensStore.hasInStore({
      userId: oldJwtPayload.userId,
      refreshToken: props.refreshToken,
    });
    if (!hasJwtInStore) {
      props.logger.warn({ jwtRefreshToken: props.refreshToken }, 'refresh token has not in store');
      throw new ErrorUnauthorized();
    }

    const user = await this.#userService.findOne({
      userFindOnePlainEntity: new UserFindOnePlainEntity({ id: oldJwtPayload.userId }),
    });
    if (!user) {
      props.logger.warn('user does not exist');
      throw new ErrorUserNotExists();
    }

    const jwtPayload = { userId: user.id, ...(props.jwtPayload ?? {}) };
    const accessToken = this.#jwtService.generateAccessToken(jwtPayload);
    const refreshToken = this.#jwtService.generateRefreshToken(jwtPayload);

    await this.#refreshTokensStore.save({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + CONFIG.jwt.refreshTokenExpiry),
    });

    this.#refreshTokensStore.delete({ userId: user.id, refreshToken: props.refreshToken });

    return { accessToken, refreshToken };
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
