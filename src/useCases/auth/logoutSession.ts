import { ITokensSessionsBlacklistStore, ITokensSessionsStore } from '@/domains/repositories/stores';
import { ILogoutSessionUseCase } from '@/domains/useCases';
import { SessionEntity } from '@/entities';
import { ErrorUnauthorized } from '@/pkg';

export class LogoutSessionUseCase implements ILogoutSessionUseCase {
  readonly #tokensSessionsStore: ITokensSessionsStore;
  readonly #tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;

  constructor(props: {
    tokensSessionsStore: ITokensSessionsStore;
    tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;
  }) {
    this.#tokensSessionsStore = props.tokensSessionsStore;
    this.#tokensSessionsBlacklistStore = props.tokensSessionsBlacklistStore;
  }

  async execute(props: Parameters<ILogoutSessionUseCase['execute']>[0]): Promise<void> {
    const currentSession = await this.#getCurrentSessionOrThrow({
      userId: props.userId,
      refreshJti: props.refreshJti,
    });
    await this.#blacklistAndDeleteCurrentSession({
      userId: props.userId,
      refreshJti: props.refreshJti,
      currentSession,
    });
    await this.#tryBlacklistCurrentAccessToken(props.currentAccessToken);
  }

  async #getCurrentSessionOrThrow(props: {
    userId: Parameters<ILogoutSessionUseCase['execute']>[0]['userId'];
    refreshJti: string;
  }): Promise<SessionEntity> {
    const currentSession = await this.#tokensSessionsStore.getSessionByRefreshJti({
      userId: props.userId,
      refreshJti: props.refreshJti,
    });
    if (!currentSession) throw new ErrorUnauthorized();
    return currentSession;
  }

  async #blacklistAndDeleteCurrentSession(props: {
    userId: Parameters<ILogoutSessionUseCase['execute']>[0]['userId'];
    refreshJti: string;
    currentSession: SessionEntity;
  }): Promise<void> {
    await this.#tokensSessionsBlacklistStore.addHashedAccessJtiToBlacklist({
      accessJtiHash: props.currentSession.accessJtiHash,
      expiresAt: props.currentSession.accessExpiresAt,
    });
    await this.#tokensSessionsStore.deleteSessionByRefreshJti({
      userId: props.userId,
      refreshJti: props.refreshJti,
    });
  }

  async #tryBlacklistCurrentAccessToken(
    currentAccessToken: Parameters<ILogoutSessionUseCase['execute']>[0]['currentAccessToken'],
  ): Promise<void> {
    if (!currentAccessToken) return;

    await this.#tokensSessionsBlacklistStore.addAccessJtiToBlacklist({
      accessJti: currentAccessToken.jti,
      expiresAt: currentAccessToken.expiresAt,
    });
  }
}
