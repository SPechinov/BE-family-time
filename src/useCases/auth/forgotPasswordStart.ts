import { CONFIG } from '@/config';
import { IOtpCodesStore } from '@/domains/repositories/stores';
import { IRateLimiterService, IUsersService } from '@/domains/services';
import { IForgotPasswordStartUseCase } from '@/domains/useCases';
import { UserFindOnePlainEntity } from '@/entities';
import { ErrorInvalidContacts, ErrorUserNotExists, generateNumericCode } from '@/pkg';

export class ForgotPasswordStartUseCase implements IForgotPasswordStartUseCase {
  readonly #usersService: IUsersService;
  readonly #forgotPasswordOtpCodesStore: IOtpCodesStore;
  readonly #rateLimiter: IRateLimiterService;

  constructor(props: {
    usersService: IUsersService;
    forgotPasswordOtpCodesStore: IOtpCodesStore;
    rateLimiter: IRateLimiterService;
  }) {
    this.#usersService = props.usersService;
    this.#forgotPasswordOtpCodesStore = props.forgotPasswordOtpCodesStore;
    this.#rateLimiter = props.rateLimiter;
  }

  async execute(props: Parameters<IForgotPasswordStartUseCase['execute']>[0]): Promise<{ otpCode: string }> {
    const contact = this.#getContactOrThrow(props.userContactsPlainEntity.getContact());

    await this.#rateLimiter.checkLimitOrThrow({ key: contact });

    await this.#ensureUserExistsOrThrow(props);

    const otpCode = generateNumericCode(CONFIG.codesLength.forgotPassword);
    await this.#forgotPasswordOtpCodesStore.set({ key: contact, code: otpCode });
    props.logger.debug({ otpCode, contact }, 'forgot-password otp saved');

    return { otpCode };
  }

  #getContactOrThrow(contact?: string | null): string {
    if (!contact) throw new ErrorInvalidContacts();
    return contact;
  }

  async #ensureUserExistsOrThrow(props: Parameters<IForgotPasswordStartUseCase['execute']>[0]): Promise<void> {
    const foundUser = await this.#usersService.findOne(
      new UserFindOnePlainEntity({ contactsPlain: props.userContactsPlainEntity }),
      { logger: props.logger },
    );
    if (!foundUser) throw new ErrorUserNotExists();
  }
}
