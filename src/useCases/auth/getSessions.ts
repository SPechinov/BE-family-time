import { ITokensSessionsStore } from '@/domains/repositories/stores';
import { IGetSessionsUseCase } from '@/domains/useCases';
import { ErrorUnauthorized } from '@/pkg';

export class GetSessionsUseCase implements IGetSessionsUseCase {
  readonly #tokensSessionsStore: ITokensSessionsStore;

  constructor(props: { tokensSessionsStore: ITokensSessionsStore }) {
    this.#tokensSessionsStore = props.tokensSessionsStore;
  }

  async execute(props: Parameters<IGetSessionsUseCase['execute']>[0]) {
    const currentSession = await this.#tokensSessionsStore.getSessionByRefreshJti({
      userId: props.userId,
      refreshJti: props.refreshJti,
    });
    if (!currentSession) throw new ErrorUnauthorized();

    return this.#tokensSessionsStore.getUserSessions({
      userId: props.userId,
      currentSessionId: props.currentSessionId,
    });
  }
}
