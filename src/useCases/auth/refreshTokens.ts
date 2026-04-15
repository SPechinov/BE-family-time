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

    const tokens = this.#tokensSessionsGenerator.generateTokens({
      userId: refreshPayload.userId,
      userAgent: props.userAgent,
    });
    const newRefreshPayload = this.#tokensSessionsPayloadVerifier.verifyRefreshTokenOrThrow(tokens.refresh);
    const newAccessPayload = this.#tokensSessionsPayloadVerifier.verifyAccessTokenOrThrow(tokens.access);

    await this.#tokensSessionsBlacklistStore.addHashedAccessJtiToBlacklist({
      accessJtiHash: currentSession.accessJtiHash,
      expiresAt: currentSession.accessExpiresAt,
    });
    await this.#tokensSessionsStore.deleteSessionByRefreshJti({
      userId: refreshPayload.userId,
      refreshJti: refreshPayload.jti,
    });
    await this.#tokensSessionsStore.addSession({
      userId: newRefreshPayload.userId,
      sessionId: newRefreshPayload.sid,
      userAgent: props.userAgent,
      expiresAt: (newRefreshPayload.exp ?? Math.floor(Date.now() / 1000)) * 1000,
      refreshJti: newRefreshPayload.jti,
      accessJti: newAccessPayload.jti,
      accessExpiresAt: newAccessPayload.exp * 1000,
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
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
    };
  }
}
