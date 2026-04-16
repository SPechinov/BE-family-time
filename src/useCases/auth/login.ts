import { ITokensSessionsStore } from '@/domains/repositories/stores';
import {
  IRateLimiterService,
  ITokensSessionsPayloadVerifier,
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
  readonly #tokensSessionsPayloadVerifier: ITokensSessionsPayloadVerifier;

  constructor(props: {
    usersService: IUsersService;
    rateLimiter: IRateLimiterService;
    tokensSessionsGenerator: ITokensSessionsGenerator;
    tokensSessionsStore: ITokensSessionsStore;
    tokensSessionsPayloadVerifier: ITokensSessionsPayloadVerifier;
  }) {
    this.#usersService = props.usersService;
    this.#rateLimiter = props.rateLimiter;
    this.#tokensSessionsGenerator = props.tokensSessionsGenerator;
    this.#tokensSessionsStore = props.tokensSessionsStore;
    this.#tokensSessionsPayloadVerifier = props.tokensSessionsPayloadVerifier;
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

    const tokens = this.#tokensSessionsGenerator.generateTokens({
      userId: user.id,
      userAgent: props.userAgent,
    });
    const refreshPayload = this.#tokensSessionsPayloadVerifier.verifyRefreshTokenOrThrow(tokens.refresh);
    const accessPayload = this.#tokensSessionsPayloadVerifier.verifyAccessTokenOrThrow(tokens.access);

    await this.#tokensSessionsStore.addSession({
      userId: refreshPayload.userId,
      sessionId: refreshPayload.sid,
      userAgent: props.userAgent,
      expiresAt: (refreshPayload.exp ?? Math.floor(Date.now() / 1000)) * 1000,
      refreshJti: refreshPayload.jti,
      accessJti: accessPayload.jti,
      accessExpiresAt: accessPayload.exp * 1000,
    });

    return {
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
    };
  }
}
