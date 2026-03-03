import { CONFIG } from '@/config';
import { IRateLimiterService, IUsersService } from '@/domains/services';
import { DefaultProps, IAuthUseCases } from '@/domains/useCases';
import { IOtpCodesStore } from '@/domains/repositories/stores';
import {
  UserContactsPlainEntity,
  UserCreatePlainEntity,
  UserFindOnePlainEntity,
  UserEntity,
  UserPasswordPlainEntity,
  UserPatchOnePlainEntity,
} from '@/entities';
import {
  ErrorInvalidCode,
  ErrorInvalidContacts,
  ErrorUserNotExists,
  ErrorUserExists,
  generateNumericCode,
  ErrorDoubleRegistration,
  ErrorInvalidLoginOrPassword,
} from '@/pkg';

export class AuthUseCases implements IAuthUseCases {
  readonly #userService: IUsersService;
  readonly #registrationOtpCodesStore: IOtpCodesStore;
  readonly #forgotPasswordOtpCodesStore: IOtpCodesStore;
  readonly #rateLimiter: IRateLimiterService;
  readonly #pendRegistrationEndRequests = new Set<string>();

  constructor(props: {
    usersService: IUsersService;
    registrationOtpCodesStore: IOtpCodesStore;
    forgotPasswordOtpCodesStore: IOtpCodesStore;
    rateLimiter: IRateLimiterService;
  }) {
    this.#userService = props.usersService;
    this.#registrationOtpCodesStore = props.registrationOtpCodesStore;
    this.#forgotPasswordOtpCodesStore = props.forgotPasswordOtpCodesStore;
    this.#rateLimiter = props.rateLimiter;
  }

  async login(
    props: DefaultProps<{
      userContactsPlainEntity: UserContactsPlainEntity;
      userPasswordPlainEntity: UserPasswordPlainEntity;
      jwtPayload?: Record<string, string>;
    }>,
  ): Promise<{ user: UserEntity }> {
    const contact = this.#getContactOrThrow(props.userContactsPlainEntity);

    await this.#rateLimiter.checkLimitOrThrow({ key: contact });

    const user = await this.#userService.findOne(
      new UserFindOnePlainEntity({ contactsPlain: props.userContactsPlainEntity }),
      { logger: props.logger },
    );

    if (!user || !user.passwordHashed) throw new ErrorInvalidLoginOrPassword();
    const verified = await this.#userService.verifyPassword(
      {
        password: props.userPasswordPlainEntity.password,
        hash: user.passwordHashed.password,
      },
      { logger: props.logger },
    );
    if (!verified) throw new ErrorInvalidLoginOrPassword();

    return { user };
  }

  async registrationStart(
    props: DefaultProps<{ userContactsPlainEntity: UserContactsPlainEntity }>,
  ): Promise<{ otpCode: string }> {
    const contact = this.#getContactOrThrow(props.userContactsPlainEntity);

    await this.#rateLimiter.checkLimitOrThrow({ key: contact });

    const otpCode = generateNumericCode(CONFIG.codesLength.registration);
    await this.#registrationOtpCodesStore.set({ key: contact, code: otpCode });
    props.logger.debug({ otpCode, contact }, 'registration code saved');

    return { otpCode };
  }

  async registrationEnd(
    props: DefaultProps<{ userCreatePlainEntity: UserCreatePlainEntity; otpCode: string }>,
  ): Promise<UserEntity> {
    const contact = this.#getContactOrThrow(props.userCreatePlainEntity.contactsPlain);

    if (this.#pendRegistrationEndRequests.has(contact)) throw new ErrorDoubleRegistration();

    try {
      this.#pendRegistrationEndRequests.add(contact);
      await this.#rateLimiter.checkLimitOrThrow({ key: contact });

      const storeOtpCode = await this.#registrationOtpCodesStore.get({ key: contact });
      this.#compareOtpCodes(storeOtpCode, props.otpCode);
      this.#registrationOtpCodesStore.delete({ key: contact }).catch((error = {}) => {
        props.logger.error({ error }, 'code did not deleted');
      });

      const foundUser = await this.#userService.findOne(
        new UserFindOnePlainEntity({
          contactsPlain: props.userCreatePlainEntity.contactsPlain,
        }),
        { logger: props.logger },
      );
      if (foundUser) throw new ErrorUserExists();

      const createdUser = await this.#userService.createOne(props.userCreatePlainEntity, { logger: props.logger });
      props.logger.debug({ contact }, 'user created');

      return createdUser;
    } finally {
      this.#pendRegistrationEndRequests.delete(contact);
    }
  }

  async forgotPasswordStart(
    props: DefaultProps<{ userContactsPlainEntity: UserContactsPlainEntity }>,
  ): Promise<{ otpCode: string }> {
    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    await this.#rateLimiter.checkLimitOrThrow({ key: contact });

    const foundUser = await this.#userService.findOne(
      new UserFindOnePlainEntity({ contactsPlain: props.userContactsPlainEntity }),
      { logger: props.logger },
    );
    if (!foundUser) throw new ErrorUserNotExists();

    const otpCode = generateNumericCode(CONFIG.codesLength.forgotPassword);
    await this.#forgotPasswordOtpCodesStore.set({ key: contact, code: otpCode });
    props.logger.debug({ otpCode, contact }, 'code saved');

    return { otpCode };
  }

  async forgotPasswordEnd(
    props: DefaultProps<{
      userContactsPlainEntity: UserContactsPlainEntity;
      password: UserPasswordPlainEntity;
      otpCode: string;
    }>,
  ): Promise<UserEntity> {
    const contact = props.userContactsPlainEntity.getContact();
    if (!contact) throw new ErrorInvalidContacts();

    await this.#rateLimiter.checkLimitOrThrow({ key: contact });

    const storeOtpCode = await this.#forgotPasswordOtpCodesStore.get({ key: contact });
    this.#compareOtpCodes(storeOtpCode, props.otpCode);
    this.#forgotPasswordOtpCodesStore.delete({ key: contact }).catch((error = {}) => {
      props.logger.error({ error }, 'code did not deleted');
    });

    const user = await this.#userService.patchOne(
      {
        userFindOnePlainEntity: new UserFindOnePlainEntity({ contactsPlain: props.userContactsPlainEntity }),
        userPatchOnePlainEntity: new UserPatchOnePlainEntity({
          passwordPlain: props.password,
        }),
      },
      { logger: props.logger },
    );

    props.logger.debug({ contact }, 'code compare success, password updated');

    return user;
  }

  #compareOtpCodes(storeOtpCode: string | null | undefined, userOtpCode: string | null | undefined) {
    if (!storeOtpCode || !userOtpCode || storeOtpCode !== userOtpCode) throw new ErrorInvalidCode();
  }

  #getContactOrThrow(userContactsPlainEntity?: UserContactsPlainEntity): string {
    const contact = userContactsPlainEntity?.getContact();
    if (!contact) throw new ErrorInvalidContacts();
    return contact;
  }
}
