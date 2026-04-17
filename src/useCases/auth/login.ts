import { ITokensSessionsStore } from '@/domains/repositories/stores';
import { IRateLimiterService, ITokensSessionsGenerator, IUsersService } from '@/domains/services';
import { ILoginUseCase } from '@/domains/useCases';
import { SessionTokenPayload, UserEntity, UserFindOnePlainEntity } from '@/entities';
import { ErrorInvalidContacts, ErrorInvalidLoginOrPassword } from '@/pkg';

export class LoginUseCase implements ILoginUseCase {
  readonly #usersService: IUsersService;
  readonly #rateLimiter: IRateLimiterService;
  readonly #tokensSessionsGenerator: ITokensSessionsGenerator;
  readonly #tokensSessionsStore: ITokensSessionsStore;

  constructor(props: {
    usersService: IUsersService;
    rateLimiter: IRateLimiterService;
    tokensSessionsGenerator: ITokensSessionsGenerator;
    tokensSessionsStore: ITokensSessionsStore;
  }) {
    this.#usersService = props.usersService;
    this.#rateLimiter = props.rateLimiter;
    this.#tokensSessionsGenerator = props.tokensSessionsGenerator;
    this.#tokensSessionsStore = props.tokensSessionsStore;
  }

  async execute(
    props: Parameters<ILoginUseCase['execute']>[0],
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const contact = this.#getContactOrThrow(props.userContactsPlainEntity.getContact());

    await this.#rateLimiter.checkLimitOrThrow({ key: contact });

    const user = await this.#authenticateUserOrThrow(props);

    const tokensPair = this.#tokensSessionsGenerator.generateTokens({
      userId: user.id,
      userAgent: props.userAgent,
    });

    await this.#persistSession({
      refreshTokenPayload: tokensPair.refreshTokenPayload,
      accessTokenPayload: tokensPair.accessTokenPayload,
      userAgent: props.userAgent,
    });

    return {
      accessToken: tokensPair.accessToken,
      refreshToken: tokensPair.refreshToken,
    };
  }

  #getContactOrThrow(contact?: string | null): string {
    if (!contact) throw new ErrorInvalidContacts();
    return contact;
  }

  async #authenticateUserOrThrow(props: Parameters<ILoginUseCase['execute']>[0]): Promise<UserEntity> {
    const user = await this.#usersService.findOne(
      new UserFindOnePlainEntity({ contactsPlain: props.userContactsPlainEntity }),
      { logger: props.logger },
    );

    if (!user || !user.passwordHashed) throw new ErrorInvalidLoginOrPassword();

    const verified = await this.#usersService.verifyPassword(
      {
        password: props.userPasswordPlainEntity.password,
        hash: user.passwordHashed.password,
      },
      { logger: props.logger },
    );
    if (!verified) throw new ErrorInvalidLoginOrPassword();

    return user;
  }

  #persistSession(props: {
    refreshTokenPayload: SessionTokenPayload;
    accessTokenPayload: SessionTokenPayload;
    userAgent: string;
  }): Promise<void> {
    return this.#tokensSessionsStore.addSession({
      userId: props.refreshTokenPayload.userId,
      sessionId: props.refreshTokenPayload.sid,
      userAgent: props.userAgent,
      expiresAt: props.refreshTokenPayload.exp * 1000,
      refreshJti: props.refreshTokenPayload.jti,
      accessJti: props.accessTokenPayload.jti,
      accessExpiresAt: props.accessTokenPayload.exp * 1000,
    });
  }
}
