import { CONFIG } from '@/config';
import { IOtpCodesStore } from '@/domains/repositories/stores';
import { IRateLimiterService } from '@/domains/services';
import { IRegistrationStartUseCase } from '@/domains/useCases';
import { ErrorInvalidContacts, generateNumericCode } from '@/pkg';

export class RegistrationStartUseCase implements IRegistrationStartUseCase {
  readonly #registrationOtpCodesStore: IOtpCodesStore;
  readonly #rateLimiter: IRateLimiterService;

  constructor(props: { registrationOtpCodesStore: IOtpCodesStore; rateLimiter: IRateLimiterService }) {
    this.#registrationOtpCodesStore = props.registrationOtpCodesStore;
    this.#rateLimiter = props.rateLimiter;
  }

  async execute(props: Parameters<IRegistrationStartUseCase['execute']>[0]): Promise<{ otpCode: string }> {
    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    await this.#rateLimiter.checkLimitOrThrow({ key: contact });

    const otpCode = generateNumericCode(CONFIG.codesLength.registration);
    await this.#registrationOtpCodesStore.set({ key: contact, code: otpCode });
    props.logger.debug({ otpCode, contact }, 'registration code saved');

    return { otpCode };
  }
}
