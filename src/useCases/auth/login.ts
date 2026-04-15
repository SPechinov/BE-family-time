import { ITokensSessionsStore } from '@/domains/repositories/stores';
import { ITokensSessionsPayloadVerifier, ITokensSessionsGenerator } from '@/domains/services';
import { IAuthUseCases, ILoginUseCase } from '@/domains/useCases';

export class LoginUseCase implements ILoginUseCase {
  readonly #authUseCases: IAuthUseCases;
  readonly #tokensSessionsGenerator: ITokensSessionsGenerator;
  readonly #tokensSessionsStore: ITokensSessionsStore;
  readonly #tokensSessionsPayloadVerifier: ITokensSessionsPayloadVerifier;

  constructor(props: {
    authUseCases: IAuthUseCases;
    tokensSessionsGenerator: ITokensSessionsGenerator;
    tokensSessionsStore: ITokensSessionsStore;
    tokensSessionsPayloadVerifier: ITokensSessionsPayloadVerifier;
  }) {
    this.#authUseCases = props.authUseCases;
    this.#tokensSessionsGenerator = props.tokensSessionsGenerator;
    this.#tokensSessionsStore = props.tokensSessionsStore;
    this.#tokensSessionsPayloadVerifier = props.tokensSessionsPayloadVerifier;
  }

  async execute(
    props: Parameters<ILoginUseCase['execute']>[0],
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { user } = await this.#authUseCases.login({
      logger: props.logger,
      userContactsPlainEntity: props.userContactsPlainEntity,
      userPasswordPlainEntity: props.userPasswordPlainEntity,
      jwtPayload: { userAgent: props.userAgent },
    });

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
