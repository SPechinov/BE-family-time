import { UserContactsHashedEntity, UserContactsPlainEntity } from './contacts';

export class UserPlainFindEntity {
  readonly #id?: string;
  readonly #contactsPlain?: UserContactsPlainEntity;

  constructor(props: { id?: string; contactsPlain?: UserContactsPlainEntity }) {
    this.#id = props.id;
    this.#contactsPlain = props.contactsPlain;
  }

  get id() {
    return this.#id;
  }

  get contactsPlain() {
    return this.#contactsPlain;
  }
}

export class UserFindEntity {
  readonly #id?: string;
  readonly #contactsHashed?: UserContactsHashedEntity;

  constructor(props: { id?: string; contactsHashed?: UserContactsHashedEntity }) {
    this.#id = props.id;
    this.#contactsHashed = props.contactsHashed;
  }

  get id() {
    return this.#id;
  }

  get contactsHashed() {
    return this.#contactsHashed;
  }
}
