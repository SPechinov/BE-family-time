import { ITokensSessionsBlacklistStore, ITokensSessionsStore } from '@/domains/repositories/stores';
import { ILogoutSessionByIdUseCase } from '@/domains/useCases';
import { ErrorSessionNotExists, ErrorUnauthorized } from '@/pkg';

export class LogoutSessionByIdUseCase implements ILogoutSessionByIdUseCase {
  readonly #tokensSessionsStore: ITokensSessionsStore;
  readonly #tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;

  constructor(props: {
    tokensSessionsStore: ITokensSessionsStore;
    tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;
  }) {
    this.#tokensSessionsStore = props.tokensSessionsStore;
    this.#tokensSessionsBlacklistStore = props.tokensSessionsBlacklistStore;
  }

  async execute(props: Parameters<ILogoutSessionByIdUseCase['execute']>[0]): Promise<{ isCurrentSession: boolean }> {
    const currentSession = await this.#tokensSessionsStore.getSessionByRefreshJti({
      userId: props.userId,
      refreshJti: props.refreshJti,
    });
    if (!currentSession) throw new ErrorUnauthorized();

    const session = await this.#tokensSessionsStore.getSessionById({ sessionId: props.sessionId });
    if (!session || session.userId !== props.userId) {
      throw new ErrorSessionNotExists();
    }

    await this.#tokensSessionsBlacklistStore.addHashedAccessJtiToBlacklist({
      accessJtiHash: session.accessJtiHash,
      expiresAt: session.accessExpiresAt,
    });
    await this.#tokensSessionsStore.deleteSessionById({
      userId: props.userId,
      sessionId: props.sessionId,
    });

    return {
      isCurrentSession: props.sessionId === props.currentSessionId,
    };
  }
}
