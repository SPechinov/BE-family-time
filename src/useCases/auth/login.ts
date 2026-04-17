import { ITokensSessionsStore } from '@/domains/repositories/stores';
import {
  IRateLimiterService,
  ITokensSessionsGenerator,
  IUsersService,
} from '@/domains/services';
import { ILoginUseCase } from '@/domains/useCases';
import { UserFindOnePlainEntity } from '@/entities';
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
    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    await this.#rateLimiter.checkLimitOrThrow({ key: contact });

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

    const tokensPair = this.#tokensSessionsGenerator.generateTokens({
      userId: user.id,
      userAgent: props.userAgent,
    });

    await this.#tokensSessionsStore.addSession({
      userId: tokensPair.refreshTokenPayload.userId,
      sessionId: tokensPair.refreshTokenPayload.sid,
      userAgent: props.userAgent,
      expiresAt: tokensPair.refreshTokenPayload.exp * 1000,
      refreshJti: tokensPair.refreshTokenPayload.jti,
      accessJti: tokensPair.accessTokenPayload.jti,
      accessExpiresAt: tokensPair.accessTokenPayload.exp * 1000,
    });

    return {
      accessToken: tokensPair.accessToken,
      refreshToken: tokensPair.refreshToken,
    };
  }
}
