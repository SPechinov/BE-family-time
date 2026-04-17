import { ITokensSessionsBlacklistStore, ITokensSessionsStore } from '@/domains/repositories/stores';
import { ILogoutSessionByIdUseCase } from '@/domains/useCases';
import { SessionEntity } from '@/entities';
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
    await this.#ensureCurrentSessionOrThrow({
      userId: props.userId,
      refreshJti: props.refreshJti,
    });

    const targetSession = await this.#getTargetSessionOrThrow({
      userId: props.userId,
      sessionId: props.sessionId,
    });

    await this.#blacklistAndDeleteSession({
      userId: props.userId,
      sessionId: props.sessionId,
      session: targetSession,
    });

    const isCurrentSession = this.#isCurrentSession({
      sessionId: props.sessionId,
      currentSessionId: props.currentSessionId,
    });

    if (isCurrentSession) {
      await this.#tryBlacklistCurrentAccessToken(props.currentAccessToken);
    }

    return { isCurrentSession };
  }

  async #ensureCurrentSessionOrThrow(props: {
    userId: Parameters<ILogoutSessionByIdUseCase['execute']>[0]['userId'];
    refreshJti: string;
  }): Promise<void> {
    const currentSession = await this.#tokensSessionsStore.getSessionByRefreshJti({
      userId: props.userId,
      refreshJti: props.refreshJti,
    });
    if (!currentSession) throw new ErrorUnauthorized();
  }

  async #getTargetSessionOrThrow(props: {
    userId: Parameters<ILogoutSessionByIdUseCase['execute']>[0]['userId'];
    sessionId: Parameters<ILogoutSessionByIdUseCase['execute']>[0]['sessionId'];
  }): Promise<SessionEntity> {
    const session = await this.#tokensSessionsStore.getSessionById({ sessionId: props.sessionId });
    if (!session || session.userId !== props.userId) {
      throw new ErrorSessionNotExists();
    }

    return session;
  }

  async #blacklistAndDeleteSession(props: {
    userId: Parameters<ILogoutSessionByIdUseCase['execute']>[0]['userId'];
    sessionId: Parameters<ILogoutSessionByIdUseCase['execute']>[0]['sessionId'];
    session: SessionEntity;
  }): Promise<void> {
    await this.#tokensSessionsBlacklistStore.addHashedAccessJtiToBlacklist({
      accessJtiHash: props.session.accessJtiHash,
      expiresAt: props.session.accessExpiresAt,
    });
    await this.#tokensSessionsStore.deleteSessionById({
      userId: props.userId,
      sessionId: props.sessionId,
    });
  }

  #isCurrentSession(props: {
    sessionId: Parameters<ILogoutSessionByIdUseCase['execute']>[0]['sessionId'];
    currentSessionId: Parameters<ILogoutSessionByIdUseCase['execute']>[0]['currentSessionId'];
  }): boolean {
    return props.sessionId === props.currentSessionId;
  }

  async #tryBlacklistCurrentAccessToken(
    currentAccessToken: Parameters<ILogoutSessionByIdUseCase['execute']>[0]['currentAccessToken'],
  ): Promise<void> {
    if (!currentAccessToken) return;

    await this.#tokensSessionsBlacklistStore.addAccessJtiToBlacklist({
      accessJti: currentAccessToken.jti,
      expiresAt: currentAccessToken.expiresAt,
    });
  }
}
