import {
  UserContactsEncryptedEntity,
  UserContactsHashedEntity,
  UserPatchOneEntity,
  UserPatchOnePlainEntity,
  UserPasswordHashedEntity,
  UserPersonalInfoEncryptedEntity,
} from '@/entities';
import { IEncryptionService, IHashPasswordService, IHmacService } from '@/domains/services';
import { ErrorInvalidUserPatchParams } from '@/pkg/errors';

export class UserPatchMapper {
  readonly #hmacService: IHmacService;
  readonly #encryptionService: IEncryptionService;
  readonly #hashPasswordService: IHashPasswordService;

  constructor(props: {
    hmacService: IHmacService;
    encryptionService: IEncryptionService;
    hashPasswordService: IHashPasswordService;
  }) {
    this.#hmacService = props.hmacService;
    this.#encryptionService = props.encryptionService;
    this.#hashPasswordService = props.hashPasswordService;
  }

  async mapPlainToEncrypted(props: {
    userPatchOnePlainEntity: UserPatchOnePlainEntity;
    encryptionSalt: string;
  }): Promise<UserPatchOneEntity> {
    const { personalInfoPlain, contactsPlain, passwordPlain, timeZone, language } = props.userPatchOnePlainEntity;

    const personalInfoEncrypted = await this.#preparePersonalInfo(personalInfoPlain, props.encryptionSalt);
    const { contactsEncrypted, contactsHashed } = await this.#prepareContacts(contactsPlain, props.encryptionSalt);
    const passwordHashed = await this.#preparePasswordHashed(passwordPlain);
    const dateOfBirth = personalInfoPlain?.dateOfBirth;

    if (
      personalInfoEncrypted === undefined &&
      contactsEncrypted === undefined &&
      contactsHashed === undefined &&
      passwordHashed === undefined &&
      timeZone === undefined &&
      language === undefined &&
      dateOfBirth === undefined
    ) {
      throw new ErrorInvalidUserPatchParams();
    }

    return new UserPatchOneEntity({
      personalInfoEncrypted,
      contactsEncrypted,
      contactsHashed,
      passwordHashed,
      timeZone,
      language,
      dateOfBirth,
    });
  }

  async #prepareContacts(
    contactsPlain: UserPatchOnePlainEntity['contactsPlain'],
    encryptionSalt: string,
  ): Promise<{
    contactsEncrypted: UserContactsEncryptedEntity | null | undefined;
    contactsHashed: UserContactsHashedEntity | null | undefined;
  }> {
    if (contactsPlain === undefined) return { contactsEncrypted: undefined, contactsHashed: undefined };
    if (contactsPlain === null) return { contactsEncrypted: null, contactsHashed: null };

    const { email, phone } = contactsPlain;

    const [emailEncrypted, phoneEncrypted] = await Promise.all([
      email ? this.#encryptionService.encrypt(email, encryptionSalt) : Promise.resolve(email),
      phone ? this.#encryptionService.encrypt(phone, encryptionSalt) : Promise.resolve(phone),
    ]);

    const contactsEncrypted = new UserContactsEncryptedEntity({ email: emailEncrypted, phone: phoneEncrypted });
    const contactsHashed = new UserContactsHashedEntity({
      email: email ? this.#hmacService.hash(email) : email,
      phone: phone ? this.#hmacService.hash(phone) : phone,
    });

    return { contactsEncrypted, contactsHashed };
  }

  async #preparePersonalInfo(
    personalInfoPlain: UserPatchOnePlainEntity['personalInfoPlain'],
    encryptionSalt: string,
  ): Promise<UserPersonalInfoEncryptedEntity | undefined | null> {
    if (personalInfoPlain === undefined) return undefined;
    if (personalInfoPlain === null) return null;

    const { firstName, lastName } = personalInfoPlain;
    const [encryptedFirstName, encryptedLastName] = await Promise.all([
      firstName === undefined
        ? Promise.resolve(undefined)
        : firstName === null
          ? Promise.resolve(null)
          : this.#encryptionService.encrypt(firstName, encryptionSalt),
      lastName === undefined
        ? Promise.resolve(undefined)
        : lastName === null
          ? Promise.resolve(null)
          : this.#encryptionService.encrypt(lastName, encryptionSalt),
    ]);

    return new UserPersonalInfoEncryptedEntity({
      firstName: encryptedFirstName,
      lastName: encryptedLastName,
    });
  }

  async #preparePasswordHashed(
    passwordPlain: UserPatchOnePlainEntity['passwordPlain'],
  ): Promise<UserPasswordHashedEntity | undefined | null> {
    if (passwordPlain === undefined) return undefined;
    if (passwordPlain === null) return null;

    const hashedPassword = await this.#hashPasswordService.hash(passwordPlain.password);
    return new UserPasswordHashedEntity(hashedPassword);
  }
}
