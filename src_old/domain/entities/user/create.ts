import { UserPersonalInfoEntity } from './personalInfo';
import { UserContactsEncryptedEntity, UserContactsHashedEntity, UserContactsPlainEntity } from './contacts';

export class UserPlainCreateEntity {
  readonly #personalInfo: UserPersonalInfoEntity;
  readonly #contacts: UserContactsPlainEntity;
  readonly #passwordPlain?: string;

  constructor(props: {
    personalInfo: UserPersonalInfoEntity;
    contacts: UserContactsPlainEntity;
    passwordPlain?: string;
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

export class UserCreateEntity {
  readonly #personalInfo: UserPersonalInfoEntity;
  readonly #contactsHashed: UserContactsHashedEntity;
  readonly #contactsEncrypted: UserContactsEncryptedEntity;
  readonly #passwordHashed?: string;

  constructor(props: {
    personalInfo: UserPersonalInfoEntity;
    contactsHashed: UserContactsHashedEntity;
    contactsEncrypted: UserContactsEncryptedEntity;
    passwordHashed?: string;
  }) {
    this.#personalInfo = props.personalInfo;
    this.#contactsHashed = props.contactsHashed;
    this.#contactsEncrypted = props.contactsEncrypted;
    this.#passwordHashed = props.passwordHashed;
  }

  get personalInfo() {
    return this.#personalInfo;
  }

  get contactsHashed() {
    return this.#contactsHashed;
  }

  get contactsEncrypted() {
    return this.#contactsEncrypted;
  }

  get passwordHashed() {
    return this.#passwordHashed;
  }
}
