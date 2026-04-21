import { IEncryptionService } from '@/domains/services';
import {
  UserContactsEncryptedEntity,
  UserContactsPlainEntity,
  UserPersonalInfoEncryptedEntity,
  UserPersonalInfoPlainEntity,
} from '@/entities';

export class UserCryptoMapper {
  readonly #encryptionService: IEncryptionService;

  constructor(props: { encryptionService: IEncryptionService }) {
    this.#encryptionService = props.encryptionService;
  }

  async encryptContacts(
    contactsPlain?: UserContactsPlainEntity | null,
    encryptionSalt?: string,
  ): Promise<UserContactsEncryptedEntity | null | undefined> {
    if (contactsPlain === undefined) return undefined;
    if (contactsPlain === null) return null;
    if (!encryptionSalt) return undefined;

    const [emailEncrypted, phoneEncrypted] = await Promise.all([
      contactsPlain.email ? this.#encryptionService.encrypt(contactsPlain.email, encryptionSalt) : contactsPlain.email,
      contactsPlain.phone ? this.#encryptionService.encrypt(contactsPlain.phone, encryptionSalt) : contactsPlain.phone,
    ]);

    return new UserContactsEncryptedEntity({ email: emailEncrypted, phone: phoneEncrypted });
  }

  async encryptPersonalInfo(
    personalInfoPlain?: UserPersonalInfoPlainEntity | null,
    encryptionSalt?: string,
  ): Promise<UserPersonalInfoEncryptedEntity | null | undefined> {
    if (personalInfoPlain === undefined) return undefined;
    if (personalInfoPlain === null) return null;
    if (!encryptionSalt) return undefined;

    const dateOfBirthIso =
      personalInfoPlain.dateOfBirth === undefined
        ? undefined
        : personalInfoPlain.dateOfBirth === null
          ? null
          : personalInfoPlain.dateOfBirth.toISOString();

    const [encryptedFirstName, encryptedLastName, encryptedDateOfBirth] = await Promise.all([
      this.#encryptOptionalField(personalInfoPlain.firstName, encryptionSalt),
      this.#encryptOptionalField(personalInfoPlain.lastName, encryptionSalt),
      this.#encryptOptionalField(dateOfBirthIso, encryptionSalt),
    ]);

    return new UserPersonalInfoEncryptedEntity({
      firstName: encryptedFirstName,
      lastName: encryptedLastName,
      dateOfBirth: encryptedDateOfBirth,
    });
  }

  async decryptContacts(
    encryptionSalt: string,
    contactsEncrypted?: UserContactsEncryptedEntity,
  ): Promise<UserContactsPlainEntity | undefined> {
    if (!(contactsEncrypted instanceof UserContactsEncryptedEntity)) return;
    if (!contactsEncrypted.getContact()) return;

    const { email, phone } = contactsEncrypted;
    return new UserContactsPlainEntity({
      email: email ? await this.#encryptionService.decrypt(email, encryptionSalt) : undefined,
      phone: phone ? await this.#encryptionService.decrypt(phone, encryptionSalt) : undefined,
    });
  }

  async decryptPersonalInfo(
    encryptionSalt: string,
    personalInfoEncrypted?: UserPersonalInfoEncryptedEntity,
  ): Promise<UserPersonalInfoPlainEntity | undefined> {
    if (!(personalInfoEncrypted instanceof UserPersonalInfoEncryptedEntity)) return;

    if (
      personalInfoEncrypted.firstName === undefined &&
      personalInfoEncrypted.lastName === undefined &&
      personalInfoEncrypted.dateOfBirth === undefined
    ) {
      return;
    }

    const decryptedDateOfBirth = personalInfoEncrypted.dateOfBirth
      ? await this.#decryptOptionalField(personalInfoEncrypted.dateOfBirth, encryptionSalt)
      : personalInfoEncrypted.dateOfBirth;

    return new UserPersonalInfoPlainEntity({
      firstName: personalInfoEncrypted.firstName
        ? await this.#decryptOptionalField(personalInfoEncrypted.firstName, encryptionSalt)
        : undefined,
      lastName: personalInfoEncrypted.lastName
        ? await this.#decryptOptionalField(personalInfoEncrypted.lastName, encryptionSalt)
        : undefined,
      dateOfBirth:
        decryptedDateOfBirth === undefined
          ? undefined
          : decryptedDateOfBirth === null
            ? null
            : this.#parseDateOrNull(decryptedDateOfBirth),
    });
  }

  async #decryptOptionalField(value: string, encryptionSalt: string): Promise<string | null> {
    if (value.trim() === '' || value.split(':').length !== 3) {
      return null;
    }

    try {
      return await this.#encryptionService.decrypt(value, encryptionSalt);
    } catch {
      return null;
    }
  }

  async #encryptOptionalField(
    value: string | null | undefined,
    encryptionSalt: string,
  ): Promise<string | null | undefined> {
    if (value === undefined) return undefined;
    if (value === null) return null;

    return this.#encryptionService.encrypt(value, encryptionSalt);
  }

  #parseDateOrNull(value: string): Date | null {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date;
  }
}
