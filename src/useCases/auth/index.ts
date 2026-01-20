import { CONFIG } from '@/config';
import { IOtpCodesService, IUsersService } from '@/domains/services';
import { IAuthUseCases } from '@/domains/useCases';
import { UserContactsPlainEntity, UserCreatePlainEntity, UserEntity } from '@/entities';
import { ErrorInvalidCode, ErrorInvalidContacts, generateNumericCode } from '@/pkg';
import { FastifyBaseLogger } from 'fastify';

export class AuthUseCases implements IAuthUseCases {
  readonly #userService: IUsersService;
  readonly #registrationOtpService: IOtpCodesService;

  constructor(props: { userService: IUsersService; registrationOtpService: IOtpCodesService }) {
    this.#userService = props.userService;
    this.#registrationOtpService = props.registrationOtpService;
  }

  async registrationStart(props: {
    userContactsPlainEntity: UserContactsPlainEntity;
    logger: FastifyBaseLogger;
  }): Promise<{ otpCode: string }> {
    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    const otpCode = generateNumericCode(CONFIG.codesLength.registration);
    await this.#registrationOtpService.saveCode({ key: contact, code: otpCode });

    props.logger.debug({ otpCode, contact }, 'code saved');
    return { otpCode };
  }

  async registrationEnd(props: {
    userCreatePlainEntity: UserCreatePlainEntity;
    otpCode: string;
    logger: FastifyBaseLogger;
  }): Promise<UserEntity> {
    const contact = props.userCreatePlainEntity.contactsPlain?.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    const storeOtpCode = await this.#registrationOtpService.getCode({ key: contact });

    if (!storeOtpCode || !props.otpCode || storeOtpCode !== props.otpCode) {
      props.logger.debug({ userOtpCode: props.otpCode, storeOtpCode }, 'invalid code');
      throw new ErrorInvalidCode();
    }

    props.logger.debug({ contact }, 'code compare success, saving user');

    return new UserEntity({ id: '', createdAt: new Date(), updatedAt: new Date() });
  }
}
