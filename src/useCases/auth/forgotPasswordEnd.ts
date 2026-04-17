import { IOtpCodesStore, ITokensSessionsBlacklistStore, ITokensSessionsStore } from '@/domains/repositories/stores';
import { IRateLimiterService, IUsersService } from '@/domains/services';
import { IForgotPasswordEndUseCase } from '@/domains/useCases';
import { UserContactsPlainEntity, UserEntity, UserFindOnePlainEntity, UserPatchOnePlainEntity } from '@/entities';
import { ErrorInvalidCode, ErrorInvalidContacts } from '@/pkg';
import { ILogger } from '@/pkg/logger';

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
    const { contact, contactsPlain } = this.#resolveContactsOrThrow(props.userContactsPlainEntity);

    await this.#rateLimiter.checkLimitOrThrow({ key: contact });

    await this.#validateOtpOrThrow({ contact, otpCode: props.otpCode });

    this.#deleteOtpInBackground(contact, props.logger);

    const user = await this.#updatePassword({
      contactsPlain,
      password: props.password,
      logger: props.logger,
    });
    props.logger.debug({ contact }, 'forgot-password otp verified, password updated');

    await this.#invalidateAllUserSessions(user);
  }

  #resolveContactsOrThrow(contactsPlain?: UserContactsPlainEntity): {
    contact: string;
    contactsPlain: UserContactsPlainEntity;
  } {
    const contact = contactsPlain?.getContact();
    if (!contactsPlain || !contact) throw new ErrorInvalidContacts();
    return { contact, contactsPlain };
  }

  async #validateOtpOrThrow(props: { contact: string; otpCode: string }): Promise<void> {
    const storeOtpCode = await this.#forgotPasswordOtpCodesStore.get({ key: props.contact });
    if (!storeOtpCode || storeOtpCode !== props.otpCode) throw new ErrorInvalidCode();
  }

  #deleteOtpInBackground(contact: string, logger: ILogger): void {
    this.#forgotPasswordOtpCodesStore.delete({ key: contact }).catch((error = {}) => {
      logger.error({ error }, 'failed to delete forgot-password otp code');
    });
  }

  #updatePassword(props: {
    contactsPlain: UserContactsPlainEntity;
    password: Parameters<IForgotPasswordEndUseCase['execute']>[0]['password'];
    logger: ILogger;
  }): Promise<UserEntity> {
    return this.#usersService.patchOne(
      {
        userFindOnePlainEntity: new UserFindOnePlainEntity({ contactsPlain: props.contactsPlain }),
        userPatchOnePlainEntity: new UserPatchOnePlainEntity({ passwordPlain: props.password }),
      },
      { logger: props.logger },
    );
  }

  async #invalidateAllUserSessions(user: UserEntity): Promise<void> {
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
