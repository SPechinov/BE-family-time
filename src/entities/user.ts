import { $brand } from 'zod';
import { UUID } from 'node:crypto';
export type UserId = UUID & { readonly __brand: 'UserId' };

export class UserPersonalInfoPlainEntity {
  readonly #firstName?: string | null;
  readonly #lastName?: string | null;

  constructor(props: { firstName?: string | null; lastName?: string | null }) {
    this.#firstName = props.firstName;
    this.#lastName = props.lastName;
  }

  get firstName() {
    return this.#firstName;
  }

  get lastName() {
    return this.#lastName;
  }
}

export class UserPersonalInfoEncryptedEntity extends UserPersonalInfoPlainEntity {}

export class UserContactsPlainEntity {
  readonly #email?: string | null;
  readonly #phone?: string | null;

  constructor(props: { email?: string | null; phone?: string | null }) {
    this.#email = props.email;
    this.#phone = props.phone;
  }

  get email() {
    return this.#email;
  }

  get phone() {
    return this.#phone;
  }

  getContact() {
    return this.#email ?? this.#phone;
  }
}

export class UserContactsEncryptedEntity extends UserContactsPlainEntity {}

export class UserContactsHashedEntity extends UserContactsPlainEntity {}

export class UserPasswordPlainEntity {
  readonly #password: string;

  constructor(hash: string) {
    this.#password = hash;
  }

  get password(): string {
    return this.#password;
  }
}

export class UserPasswordHashedEntity extends UserPasswordPlainEntity {}

interface UserBaseEntityProps {
  id: UserId;
  updatedAt: Date;
  createdAt: Date;
}

class UserBaseEntity {
  readonly #id: UserId;
  readonly #updatedAt: Date;
  readonly #createdAt: Date;

  constructor(props: UserBaseEntityProps) {
    this.#id = props.id;
    this.#updatedAt = props.updatedAt;
    this.#createdAt = props.createdAt;
  }

  get id() {
    return this.#id;
  }

  get updatedAt(): Date {
    return this.#updatedAt;
  }

  get createdAt(): Date {
    return this.#createdAt;
  }
}

interface UserEntityProps extends UserBaseEntityProps {
  encryptionSalt: string;
  personalInfoEncrypted?: UserPersonalInfoEncryptedEntity;
  contactsEncrypted?: UserContactsEncryptedEntity;
  contactsHashed?: UserContactsHashedEntity;
  passwordHashed?: UserPasswordHashedEntity;
}
export class UserEntity extends UserBaseEntity {
  readonly #encryptionSalt: string;
  readonly #personalInfoEncrypted?: UserPersonalInfoEncryptedEntity;
  readonly #contactsEncrypted?: UserContactsEncryptedEntity;
  readonly #contactsHashed?: UserContactsHashedEntity;
  readonly #passwordHashed?: UserPasswordHashedEntity;

  constructor(props: UserEntityProps) {
    super(props);
    this.#encryptionSalt = props.encryptionSalt;
    this.#personalInfoEncrypted = props.personalInfoEncrypted;
    this.#contactsEncrypted = props.contactsEncrypted;
    this.#contactsHashed = props.contactsHashed;
    this.#passwordHashed = props.passwordHashed;
  }

  get encryptionSalt(): string {
    return this.#encryptionSalt;
  }

  get personalInfoEncrypted() {
    return this.#personalInfoEncrypted;
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

export interface UserPlainEntityProps extends UserBaseEntityProps {
  personalInfo?: UserPersonalInfoPlainEntity;
  contacts?: UserContactsPlainEntity;
}

export class UserPlainEntity extends UserBaseEntity {
  readonly #personalInfo?: UserPersonalInfoPlainEntity;
  readonly #contacts?: UserContactsPlainEntity;

  constructor(props: UserPlainEntityProps) {
    super(props);
    this.#personalInfo = props.personalInfo;
    this.#contacts = props.contacts;
  }

  get personalInfo() {
    return this.#personalInfo;
  }

  get contacts() {
    return this.#contacts;
  }
}

export class UserCreatePlainEntity {
  readonly #personalInfoPlain?: UserPersonalInfoPlainEntity;
  readonly #contactsPlain?: UserContactsPlainEntity;
  readonly #passwordPlain?: UserPasswordPlainEntity;

  constructor(props: {
    personalInfoPlain?: UserPersonalInfoPlainEntity;
    contactsPlain?: UserContactsPlainEntity;
    passwordPlain?: UserPasswordPlainEntity;
  }) {
    this.#personalInfoPlain = props.personalInfoPlain;
    this.#contactsPlain = props.contactsPlain;
    this.#passwordPlain = props.passwordPlain;
  }

  get personalInfoPlain() {
    return this.#personalInfoPlain;
  }

  get contactsPlain() {
    return this.#contactsPlain;
  }

  get passwordPlain() {
    return this.#passwordPlain;
  }
}

export class UserCreateEntity {
  readonly #encryptionSalt: string;
  readonly #personalInfoEncrypted?: UserPersonalInfoEncryptedEntity;
  readonly #contactsHashed?: UserContactsHashedEntity;
  readonly #contactsEncrypted?: UserContactsEncryptedEntity;
  readonly #passwordHashed?: UserPasswordHashedEntity;

  constructor(props: {
    encryptionSalt: string;
    personalInfoEncrypted?: UserPersonalInfoEncryptedEntity;
    contactsHashed?: UserContactsHashedEntity;
    contactsEncrypted?: UserContactsEncryptedEntity;
    passwordHashed?: UserPasswordHashedEntity;
  }) {
    this.#encryptionSalt = props.encryptionSalt;
    this.#personalInfoEncrypted = props.personalInfoEncrypted;
    this.#contactsHashed = props.contactsHashed;
    this.#contactsEncrypted = props.contactsEncrypted;
    this.#passwordHashed = props.passwordHashed;
  }

  get encryptionSalt() {
    return this.#encryptionSalt;
  }

  get personalInfoEncrypted() {
    return this.#personalInfoEncrypted;
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

export class UserFindOnePlainEntity {
  readonly #id?: UserId;
  readonly #contactsPlain?: UserContactsPlainEntity;

  constructor(props: { id?: UserId; contactsPlain?: UserContactsPlainEntity }) {
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

export class UserFindOneEntity {
  readonly #id?: UserId;
  readonly #contactsHashed?: UserContactsHashedEntity;

  constructor(props: { id?: UserId; contactsHashed?: UserContactsHashedEntity }) {
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

export class UserPatchOnePlainEntity {
  readonly #personalInfoPlain?: UserPersonalInfoPlainEntity | null;
  readonly #contactsPlain?: UserContactsPlainEntity | null;
  readonly #passwordPlain?: UserPasswordPlainEntity | null;

  constructor(props: {
    personalInfoPlain?: UserPersonalInfoPlainEntity | null;
    contactsPlain?: UserContactsPlainEntity | null;
    passwordPlain?: UserPasswordPlainEntity | null;
  }) {
    this.#personalInfoPlain = props.personalInfoPlain;
    this.#contactsPlain = props.contactsPlain;
    this.#passwordPlain = props.passwordPlain;
  }

  get personalInfoPlain() {
    return this.#personalInfoPlain;
  }

  get contactsPlain() {
    return this.#contactsPlain;
  }

  get passwordPlain() {
    return this.#passwordPlain;
  }
}

export class UserPatchOneEntity {
  readonly #personalInfoEncrypted?: UserPersonalInfoEncryptedEntity | null;
  readonly #contactsHashed?: UserContactsHashedEntity | null;
  readonly #contactsEncrypted?: UserContactsEncryptedEntity | null;
  readonly #passwordHashed?: UserPasswordHashedEntity | null;

  constructor(props: {
    personalInfoEncrypted?: UserPersonalInfoEncryptedEntity | null;
    contactsHashed?: UserContactsHashedEntity | null;
    contactsEncrypted?: UserContactsEncryptedEntity | null;
    passwordHashed?: UserPasswordHashedEntity | null;
  }) {
    this.#personalInfoEncrypted = props.personalInfoEncrypted;
    this.#contactsHashed = props.contactsHashed;
    this.#contactsEncrypted = props.contactsEncrypted;
    this.#passwordHashed = props.passwordHashed;
  }

  get personalInfoEncrypted() {
    return this.#personalInfoEncrypted;
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
