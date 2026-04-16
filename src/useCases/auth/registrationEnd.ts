import { IOtpCodesStore } from '@/domains/repositories/stores';
import { IRateLimiterService, IUsersService } from '@/domains/services';
import { IRegistrationEndUseCase } from '@/domains/useCases';
import { UserFindOnePlainEntity } from '@/entities';
import {
  ErrorDoubleRegistration,
  ErrorInvalidCode,
  ErrorInvalidContacts,
  ErrorUserExists,
} from '@/pkg';

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
    const contact = props.userCreatePlainEntity.contactsPlain?.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    if (this.#pendRegistrationEndRequests.has(contact)) throw new ErrorDoubleRegistration();

    try {
      this.#pendRegistrationEndRequests.add(contact);
      await this.#rateLimiter.checkLimitOrThrow({ key: contact });

      const storeOtpCode = await this.#registrationOtpCodesStore.get({ key: contact });
      if (!storeOtpCode || storeOtpCode !== props.otpCode) throw new ErrorInvalidCode();

      this.#registrationOtpCodesStore.delete({ key: contact }).catch((error = {}) => {
        props.logger.error({ error }, 'code did not deleted');
      });

      const foundUser = await this.#usersService.findOne(
        new UserFindOnePlainEntity({ contactsPlain: props.userCreatePlainEntity.contactsPlain }),
        { logger: props.logger },
      );
      if (foundUser) throw new ErrorUserExists();

      await this.#usersService.createOne(props.userCreatePlainEntity, { logger: props.logger });
      props.logger.debug({ contact }, 'user created');
    } finally {
      this.#pendRegistrationEndRequests.delete(contact);
    }
  }
}
