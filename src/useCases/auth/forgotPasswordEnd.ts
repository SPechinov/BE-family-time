import { ITokensSessionsBlacklistStore, ITokensSessionsStore } from '@/domains/repositories/stores';
import { IAuthUseCases, IForgotPasswordEndUseCase } from '@/domains/useCases';

export class ForgotPasswordEndUseCase implements IForgotPasswordEndUseCase {
  readonly #authUseCases: IAuthUseCases;
  readonly #tokensSessionsStore: ITokensSessionsStore;
  readonly #tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;

  constructor(props: {
    authUseCases: IAuthUseCases;
    tokensSessionsStore: ITokensSessionsStore;
    tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;
  }) {
    this.#authUseCases = props.authUseCases;
    this.#tokensSessionsStore = props.tokensSessionsStore;
    this.#tokensSessionsBlacklistStore = props.tokensSessionsBlacklistStore;
  }

  async execute(props: Parameters<IForgotPasswordEndUseCase['execute']>[0]): Promise<void> {
    const user = await this.#authUseCases.forgotPasswordEnd({
      logger: props.logger,
      userContactsPlainEntity: props.userContactsPlainEntity,
      otpCode: props.otpCode,
      password: props.password,
    });

    const userSessions = await this.#tokensSessionsStore.getUserSessions({ userId: user.id });
    for (const userSession of userSessions) {
      const session = await this.#tokensSessionsStore.getSessionById({ sessionId: userSession.sessionId });
      if (!session || session.userId !== user.id) continue;

      await this.#tokensSessionsBlacklistStore.addHashedAccessJtiToBlacklist({
        accessJtiHash: session.accessJtiHash,
        expiresAt: session.accessExpiresAt,
      });
    }

    await this.#tokensSessionsStore.deleteAllSessions({ userId: user.id });
  }
}
