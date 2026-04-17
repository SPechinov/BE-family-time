import { ITokensSessionsBlacklistStore, ITokensSessionsStore } from '@/domains/repositories/stores';
import { ILogoutAllSessionsUseCase } from '@/domains/useCases';
import { SessionEntity } from '@/entities';
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
    await this.#getCurrentSessionOrThrow({
      userId: props.userId,
      refreshJti: props.refreshJti,
    });

    await this.#blacklistAllUserSessions({ userId: props.userId });
    await this.#tokensSessionsStore.deleteAllSessions({ userId: props.userId });
    await this.#tryBlacklistCurrentAccessToken(props.currentAccessToken);
  }

  async #getCurrentSessionOrThrow(props: {
    userId: Parameters<ILogoutAllSessionsUseCase['execute']>[0]['userId'];
    refreshJti: string;
  }): Promise<SessionEntity> {
    const currentSession = await this.#tokensSessionsStore.getSessionByRefreshJti({
      userId: props.userId,
      refreshJti: props.refreshJti,
    });
    if (!currentSession) throw new ErrorUnauthorized();
    return currentSession;
  }

  async #blacklistAllUserSessions(props: {
    userId: Parameters<ILogoutAllSessionsUseCase['execute']>[0]['userId'];
  }): Promise<void> {
    const userSessions = await this.#tokensSessionsStore.getUserSessions({ userId: props.userId });
    for (const userSession of userSessions) {
      const session = await this.#tokensSessionsStore.getSessionById({ sessionId: userSession.sessionId });
      if (!session || session.userId !== props.userId) continue;

      await this.#tokensSessionsBlacklistStore.addHashedAccessJtiToBlacklist({
        accessJtiHash: session.accessJtiHash,
        expiresAt: session.accessExpiresAt,
      });
    }
  }

  async #tryBlacklistCurrentAccessToken(
    currentAccessToken: Parameters<ILogoutAllSessionsUseCase['execute']>[0]['currentAccessToken'],
  ): Promise<void> {
    if (!currentAccessToken) return;

    await this.#tokensSessionsBlacklistStore.addAccessJtiToBlacklist({
      accessJti: currentAccessToken.jti,
      expiresAt: currentAccessToken.expiresAt,
    });
  }
}
