import { ITokensSessionsBlacklistStore, ITokensSessionsStore } from '@/domains/repositories/stores';
import { IRefreshTokensUseCase } from '@/domains/useCases';
import { ErrorUnauthorized } from '@/pkg';

export class RefreshTokensUseCase implements IRefreshTokensUseCase {
  readonly #tokensSessionsStore: ITokensSessionsStore;
  readonly #tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;

  constructor(props: {
    tokensSessionsStore: ITokensSessionsStore;
    tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;
  }) {
    this.#tokensSessionsStore = props.tokensSessionsStore;
    this.#tokensSessionsBlacklistStore = props.tokensSessionsBlacklistStore;
  }

  async execute(props: Parameters<IRefreshTokensUseCase['execute']>[0]): Promise<void> {
    const currentSession = await this.#tokensSessionsStore.getSessionByRefreshJti({
      userId: props.userId,
      refreshJti: props.refreshJti,
    });
    if (!currentSession) throw new ErrorUnauthorized();

    if (currentSession.userAgent !== props.userAgent) {
      throw new ErrorUnauthorized();
    }

    await this.#tokensSessionsBlacklistStore.addHashedAccessJtiToBlacklist({
      accessJtiHash: currentSession.accessJtiHash,
      expiresAt: currentSession.accessExpiresAt,
    });
    await this.#tokensSessionsStore.deleteSessionByRefreshJti({
      userId: props.userId,
      refreshJti: props.refreshJti,
    });
    await this.#tokensSessionsStore.addSession({
      userId: props.newSession.userId,
      sessionId: props.newSession.sessionId,
      userAgent: props.userAgent,
      expiresAt: props.newSession.refreshExpiresAt,
      refreshJti: props.newSession.refreshJti,
      accessJti: props.newSession.accessJti,
      accessExpiresAt: props.newSession.accessExpiresAt,
    });

    if (props.currentAccessToken) {
      await this.#tokensSessionsBlacklistStore.addAccessJtiToBlacklist({
        accessJti: props.currentAccessToken.jti,
        expiresAt: props.currentAccessToken.expiresAt,
      });
    }
  }
}
