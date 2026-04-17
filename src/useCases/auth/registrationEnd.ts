import { IOtpCodesStore } from '@/domains/repositories/stores';
import { IRateLimiterService, IUsersService } from '@/domains/services';
import { IRegistrationEndUseCase } from '@/domains/useCases';
import { UserContactsPlainEntity, UserFindOnePlainEntity } from '@/entities';
import { ErrorDoubleRegistration, ErrorInvalidCode, ErrorInvalidContacts, ErrorUserExists } from '@/pkg';
import { ILogger } from '@/pkg/logger';

export class RegistrationEndUseCase implements IRegistrationEndUseCase {
  readonly #usersService: IUsersService;
  readonly #registrationOtpCodesStore: IOtpCodesStore;
  readonly #rateLimiter: IRateLimiterService;
  readonly #pendRegistrationEndRequests = new Set<string>();

  constructor(props: {
    usersService: IUsersService;
    registrationOtpCodesStore: IOtpCodesStore;
    rateLimiter: IRateLimiterService;
  }) {
    this.#usersService = props.usersService;
    this.#registrationOtpCodesStore = props.registrationOtpCodesStore;
    this.#rateLimiter = props.rateLimiter;
  }

  async execute(props: Parameters<IRegistrationEndUseCase['execute']>[0]): Promise<void> {
    const { contact, contactsPlain } = this.#resolveContactsOrThrow(props.userCreatePlainEntity.contactsPlain);

    if (this.#pendRegistrationEndRequests.has(contact)) throw new ErrorDoubleRegistration();

    try {
      this.#pendRegistrationEndRequests.add(contact);

      await this.#rateLimiter.checkLimitOrThrow({ key: contact });

      await this.#validateOtpOrThrow({
        contact,
        otpCode: props.otpCode,
      });

      this.#registrationOtpCodesStore.delete({ key: contact }).catch((error = {}) => {
        props.logger.error({ error }, 'failed to delete registration otp code');
      });

      await this.#ensureUserNotExistsOrThrow({
        contactsPlain,
        logger: props.logger,
      });

      await this.#usersService.createOne(props.userCreatePlainEntity, { logger: props.logger });
      props.logger.debug({ contact }, 'user created');
    } finally {
      this.#pendRegistrationEndRequests.delete(contact);
    }
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
    const storeOtpCode = await this.#registrationOtpCodesStore.get({ key: props.contact });
    if (!storeOtpCode || storeOtpCode !== props.otpCode) throw new ErrorInvalidCode();
  }

  async #ensureUserNotExistsOrThrow(props: {
    contactsPlain: UserContactsPlainEntity;
    logger?: ILogger;
  }): Promise<void> {
    const foundUser = await this.#usersService.findOne(
      new UserFindOnePlainEntity({ contactsPlain: props.contactsPlain }),
      { logger: props.logger },
    );
    if (foundUser) throw new ErrorUserExists();
  }
}
