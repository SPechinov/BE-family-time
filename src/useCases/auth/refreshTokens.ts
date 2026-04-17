import { ITokensSessionsBlacklistStore, ITokensSessionsStore } from '@/domains/repositories/stores';
import { ITokensSessionsPayloadVerifier, ITokensSessionsGenerator } from '@/domains/services';
import { IRefreshTokensUseCase } from '@/domains/useCases';
import { ErrorUnauthorized } from '@/pkg';

export class RefreshTokensUseCase implements IRefreshTokensUseCase {
  readonly #tokensSessionsStore: ITokensSessionsStore;
  readonly #tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;
  readonly #tokensSessionsGenerator: ITokensSessionsGenerator;
  readonly #tokensSessionsPayloadVerifier: ITokensSessionsPayloadVerifier;

  constructor(props: {
    tokensSessionsStore: ITokensSessionsStore;
    tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;
    tokensSessionsGenerator: ITokensSessionsGenerator;
    tokensSessionsPayloadVerifier: ITokensSessionsPayloadVerifier;
  }) {
    this.#tokensSessionsStore = props.tokensSessionsStore;
    this.#tokensSessionsBlacklistStore = props.tokensSessionsBlacklistStore;
    this.#tokensSessionsGenerator = props.tokensSessionsGenerator;
    this.#tokensSessionsPayloadVerifier = props.tokensSessionsPayloadVerifier;
  }

  async execute(
    props: Parameters<IRefreshTokensUseCase['execute']>[0],
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshPayload = this.#tokensSessionsPayloadVerifier.verifyRefreshTokenOrThrow(props.refreshToken);

    const currentSession = await this.#tokensSessionsStore.getSessionByRefreshJti({
      userId: refreshPayload.userId,
      refreshJti: refreshPayload.jti,
    });

    if (!currentSession || currentSession.userAgent !== props.userAgent) {
      throw new ErrorUnauthorized();
    }

    const tokensPair = this.#tokensSessionsGenerator.generateTokens({
      userId: refreshPayload.userId,
      userAgent: props.userAgent,
    });

    await this.#tokensSessionsBlacklistStore.addHashedAccessJtiToBlacklist({
      accessJtiHash: currentSession.accessJtiHash,
      expiresAt: currentSession.accessExpiresAt,
    });
    await this.#tokensSessionsStore.deleteSessionByRefreshJti({
      userId: refreshPayload.userId,
      refreshJti: refreshPayload.jti,
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

    if (props.currentAccessToken) {
      const accessPayload = this.#tokensSessionsPayloadVerifier.verifyAccessToken(props.currentAccessToken);
      if (accessPayload) {
        await this.#tokensSessionsBlacklistStore.addAccessJtiToBlacklist({
          accessJti: accessPayload.jti,
          expiresAt: accessPayload.exp * 1000,
        });
      }
    }

    return {
      accessToken: tokensPair.accessToken,
      refreshToken: tokensPair.refreshToken,
    };
  }
}
