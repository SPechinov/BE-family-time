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

    const [encryptedFirstName, encryptedLastName] = await Promise.all([
      personalInfoPlain.firstName === undefined
        ? Promise.resolve(undefined)
        : personalInfoPlain.firstName === null
          ? Promise.resolve(null)
          : this.#encryptionService.encrypt(personalInfoPlain.firstName, encryptionSalt),
      personalInfoPlain.lastName === undefined
        ? Promise.resolve(undefined)
        : personalInfoPlain.lastName === null
          ? Promise.resolve(null)
          : this.#encryptionService.encrypt(personalInfoPlain.lastName, encryptionSalt),
    ]);

    return new UserPersonalInfoEncryptedEntity({
      firstName: encryptedFirstName,
      lastName: encryptedLastName,
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
    dateOfBirth?: Date | null,
  ): Promise<UserPersonalInfoPlainEntity | undefined> {
    if (!(personalInfoEncrypted instanceof UserPersonalInfoEncryptedEntity)) {
      if (dateOfBirth === undefined) return;
      return new UserPersonalInfoPlainEntity({ dateOfBirth });
    }

    if (
      personalInfoEncrypted.firstName === undefined &&
      personalInfoEncrypted.lastName === undefined &&
      dateOfBirth === undefined
    ) {
      return;
    }

    return new UserPersonalInfoPlainEntity({
      firstName: personalInfoEncrypted.firstName
        ? await this.#decryptOptionalField(personalInfoEncrypted.firstName, encryptionSalt)
        : undefined,
      lastName: personalInfoEncrypted.lastName
        ? await this.#decryptOptionalField(personalInfoEncrypted.lastName, encryptionSalt)
        : undefined,
      dateOfBirth,
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
}
