import { IOtpCodesStore, ITokensSessionsBlacklistStore, ITokensSessionsStore } from '@/domains/repositories/stores';
import { IRateLimiterService, IUsersService } from '@/domains/services';
import { IForgotPasswordEndUseCase } from '@/domains/useCases';
import { UserFindOnePlainEntity, UserPatchOnePlainEntity } from '@/entities';
import { ErrorInvalidCode, ErrorInvalidContacts } from '@/pkg';

export class ForgotPasswordEndUseCase implements IForgotPasswordEndUseCase {
  readonly #usersService: IUsersService;
  readonly #forgotPasswordOtpCodesStore: IOtpCodesStore;
  readonly #rateLimiter: IRateLimiterService;
  readonly #tokensSessionsStore: ITokensSessionsStore;
  readonly #tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;

  constructor(props: {
    usersService: IUsersService;
    forgotPasswordOtpCodesStore: IOtpCodesStore;
    rateLimiter: IRateLimiterService;
    tokensSessionsStore: ITokensSessionsStore;
    tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;
  }) {
    this.#usersService = props.usersService;
    this.#forgotPasswordOtpCodesStore = props.forgotPasswordOtpCodesStore;
    this.#rateLimiter = props.rateLimiter;
    this.#tokensSessionsStore = props.tokensSessionsStore;
    this.#tokensSessionsBlacklistStore = props.tokensSessionsBlacklistStore;
  }

  async execute(props: Parameters<IForgotPasswordEndUseCase['execute']>[0]): Promise<void> {
    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    await this.#rateLimiter.checkLimitOrThrow({ key: contact });

    const storeOtpCode = await this.#forgotPasswordOtpCodesStore.get({ key: contact });
    if (!storeOtpCode || storeOtpCode !== props.otpCode) throw new ErrorInvalidCode();

    this.#forgotPasswordOtpCodesStore.delete({ key: contact }).catch((error = {}) => {
      props.logger.error({ error }, 'code did not deleted');
    });

    const user = await this.#usersService.patchOne(
      {
        userFindOnePlainEntity: new UserFindOnePlainEntity({ contactsPlain: props.userContactsPlainEntity }),
        userPatchOnePlainEntity: new UserPatchOnePlainEntity({ passwordPlain: props.password }),
      },
      { logger: props.logger },
    );

    props.logger.debug({ contact }, 'code compare success, password updated');

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
