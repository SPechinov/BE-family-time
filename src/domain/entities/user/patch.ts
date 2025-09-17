import { UserPersonalInfoPatchEntity } from './personalInfo';
import { UserContactsEncryptedPatchEntity, UserContactsHashedPatchEntity } from './contacts';

export class UserPatchEntity {
  readonly #personalInfo?: UserPersonalInfoPatchEntity | null;
  readonly #contactsEncrypted?: UserContactsEncryptedPatchEntity | null;
  readonly #contactsHashed?: UserContactsHashedPatchEntity | null;
  readonly #passwordHashed?: string | null;

  constructor(props: {
    personalInfo?: UserPersonalInfoPatchEntity | null;
    contactsEncrypted?: UserContactsEncryptedPatchEntity | null;
    contactsHashed?: UserContactsHashedPatchEntity | null;
    passwordHashed?: string | null;
  }) {
    this.#personalInfo = props.personalInfo;
    this.#contactsEncrypted = props.contactsEncrypted;
    this.#contactsHashed = props.contactsHashed;
    this.#passwordHashed = props.passwordHashed;
  }

  get personalInfo() {
    return this.#personalInfo;
  }

  get contactsEncrypted() {
    return this.#contactsEncrypted;
  }

  get contactsHashed() {
    return this.#contactsHashed;
  }

  get passwordHashed() {
    return this.#passwordHashed;
  }
}
