import { UserPersonalInfoEntity } from './personalInfo';
import { UserContactsEncryptedEntity, UserContactsHashedEntity } from './contacts';

export class UserEntity {
  readonly #id: string;
  readonly #personalInfo: UserPersonalInfoEntity;
  readonly #contactsEncrypted: UserContactsEncryptedEntity;
  readonly #contactsHashed: UserContactsHashedEntity;
  readonly #passwordHashed?: string;
  readonly #updatedAt: Date;
  readonly #createdAt: Date;

  constructor(props: {
    id: string;
    personalInfo: UserPersonalInfoEntity;
    contactsEncrypted: UserContactsEncryptedEntity;
    contactsHashed: UserContactsHashedEntity;
    passwordHashed?: string;
    updatedAt: Date;
    createdAt: Date;
  }) {
    this.#id = props.id;
    this.#personalInfo = props.personalInfo;
    this.#contactsEncrypted = props.contactsEncrypted;
    this.#contactsHashed = props.contactsHashed;
    this.#passwordHashed = props.passwordHashed;
    this.#updatedAt = props.updatedAt;
    this.#createdAt = props.createdAt;
  }

  get id() {
    return this.#id;
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

  get updatedAt() {
    return this.#updatedAt;
  }

  get createdAt() {
    return this.#createdAt;
  }
}