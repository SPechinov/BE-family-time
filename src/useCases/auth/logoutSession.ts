import { ITokensSessionsBlacklistStore, ITokensSessionsStore } from '@/domains/repositories/stores';
import { ILogoutSessionUseCase } from '@/domains/useCases';
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
    const currentSession = await this.#tokensSessionsStore.getSessionByRefreshJti({
      userId: props.userId,
      refreshJti: props.refreshJti,
    });
    if (!currentSession) throw new ErrorUnauthorized();

    await this.#tokensSessionsBlacklistStore.addHashedAccessJtiToBlacklist({
      accessJtiHash: currentSession.accessJtiHash,
      expiresAt: currentSession.accessExpiresAt,
    });
    await this.#tokensSessionsStore.deleteSessionByRefreshJti({
      userId: props.userId,
      refreshJti: props.refreshJti,
    });
  }
}
