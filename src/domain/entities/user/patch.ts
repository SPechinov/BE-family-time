import { UserPersonalInfoPatchEntity } from './personalInfo';
import { UserContactsEncryptedPatchEntity, UserContactsHashedPatchEntity, UserContactsPatchEntity } from './contacts';

export class UserPlainPatchEntity {
  readonly #personalInfo?: UserPersonalInfoPatchEntity | null;
  readonly #contacts?: UserContactsPatchEntity | null;
  readonly #passwordPlain?: string | null;

  constructor(props: {
    personalInfo?: UserPersonalInfoPatchEntity | null;
    contacts?: UserContactsPatchEntity | null;
    passwordPlain?: string | null;
  }) {
    this.#personalInfo = props.personalInfo;
    this.#contacts = props.contacts;
    this.#passwordPlain = props.passwordPlain;
  }

  get personalInfo() {
    return this.#personalInfo;
  }

  get contacts() {
    return this.#contacts;
  }

  get passwordPlain() {
    return this.#passwordPlain;
  }
}

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
