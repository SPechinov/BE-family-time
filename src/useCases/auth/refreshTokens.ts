import { ITokensSessionsBlacklistStore, ITokensSessionsStore } from '@/domains/repositories/stores';
import { ITokensSessionsPayloadVerifier, ITokensSessionsGenerator } from '@/domains/services';
import { IRefreshTokensUseCase } from '@/domains/useCases';
import { SessionEntity, SessionTokenPayload } from '@/entities';
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
    const currentSession = await this.#getCurrentSessionOrThrow({
      userId: refreshPayload.userId,
      refreshJti: refreshPayload.jti,
      userAgent: props.userAgent,
    });

    const tokensPair = this.#tokensSessionsGenerator.generateTokens({
      userId: refreshPayload.userId,
      userAgent: props.userAgent,
    });
    await this.#replaceSession({
      currentSession,
      refreshPayload,
      nextRefreshPayload: tokensPair.refreshTokenPayload,
      nextAccessPayload: tokensPair.accessTokenPayload,
      userAgent: props.userAgent,
    });
    await this.#tryBlacklistCurrentAccessToken(props.currentAccessToken);

    return {
      accessToken: tokensPair.accessToken,
      refreshToken: tokensPair.refreshToken,
    };
  }

  async #getCurrentSessionOrThrow(props: {
    userId: SessionTokenPayload['userId'];
    refreshJti: string;
    userAgent: string;
  }): Promise<SessionEntity> {
    const currentSession = await this.#tokensSessionsStore.getSessionByRefreshJti({
      userId: props.userId,
      refreshJti: props.refreshJti,
    });

    if (!currentSession || currentSession.userAgent !== props.userAgent) {
      throw new ErrorUnauthorized();
    }

    return currentSession;
  }

  async #replaceSession(props: {
    currentSession: SessionEntity;
    refreshPayload: SessionTokenPayload;
    nextRefreshPayload: SessionTokenPayload;
    nextAccessPayload: SessionTokenPayload;
    userAgent: string;
  }): Promise<void> {
    await this.#tokensSessionsBlacklistStore.addHashedAccessJtiToBlacklist({
      accessJtiHash: props.currentSession.accessJtiHash,
      expiresAt: props.currentSession.accessExpiresAt,
    });
    await this.#tokensSessionsStore.deleteSessionByRefreshJti({
      userId: props.refreshPayload.userId,
      refreshJti: props.refreshPayload.jti,
    });
    await this.#tokensSessionsStore.addSession({
      userId: props.nextRefreshPayload.userId,
      sessionId: props.nextRefreshPayload.sid,
      userAgent: props.userAgent,
      expiresAt: props.nextRefreshPayload.exp * 1000,
      refreshJti: props.nextRefreshPayload.jti,
      accessJti: props.nextAccessPayload.jti,
      accessExpiresAt: props.nextAccessPayload.exp * 1000,
    });
  }

  async #tryBlacklistCurrentAccessToken(currentAccessToken?: string): Promise<void> {
    if (!currentAccessToken) return;

    const accessPayload = this.#tokensSessionsPayloadVerifier.verifyAccessToken(currentAccessToken);
    if (!accessPayload) return;

    await this.#tokensSessionsBlacklistStore.addAccessJtiToBlacklist({
      accessJti: accessPayload.jti,
      expiresAt: accessPayload.exp * 1000,
    });
  }
}
