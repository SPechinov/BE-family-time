import { ITokensSessionsBlacklistStore, ITokensSessionsStore } from '@/domains/repositories/stores';
import { ILogoutAllSessionsUseCase } from '@/domains/useCases';
import { ErrorUnauthorized } from '@/pkg';

export class LogoutAllSessionsUseCase implements ILogoutAllSessionsUseCase {
  readonly #tokensSessionsStore: ITokensSessionsStore;
  readonly #tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;

  constructor(props: {
    tokensSessionsStore: ITokensSessionsStore;
    tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;
  }) {
    this.#tokensSessionsStore = props.tokensSessionsStore;
    this.#tokensSessionsBlacklistStore = props.tokensSessionsBlacklistStore;
  }

  async execute(props: Parameters<ILogoutAllSessionsUseCase['execute']>[0]): Promise<void> {
    const currentSession = await this.#tokensSessionsStore.getSessionByRefreshJti({
      userId: props.userId,
      refreshJti: props.refreshJti,
    });
    if (!currentSession) throw new ErrorUnauthorized();

    const userSessions = await this.#tokensSessionsStore.getUserSessions({ userId: props.userId });
    for (const userSession of userSessions) {
      const session = await this.#tokensSessionsStore.getSessionById({ sessionId: userSession.sessionId });
      if (!session || session.userId !== props.userId) continue;

      await this.#tokensSessionsBlacklistStore.addHashedAccessJtiToBlacklist({
        accessJtiHash: session.accessJtiHash,
        expiresAt: session.accessExpiresAt,
      });
    }

    await this.#tokensSessionsStore.deleteAllSessions({ userId: props.userId });
  }
}
