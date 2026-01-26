export class UserPersonalInfoPlainEntity {
  readonly #firstName?: string;
  readonly #lastName?: string;

  constructor(props: { firstName?: string; lastName?: string }) {
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
  readonly #email?: string;
  readonly #phone?: string;

  constructor(props: { email?: string; phone?: string }) {
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

export class UserEntity {
  readonly #id: string;
  readonly #encryptionSalt: string;
  readonly #updatedAt: Date;
  readonly #createdAt: Date;
  readonly #personalInfoPlain?: UserPersonalInfoPlainEntity;
  readonly #personalInfoEncrypted?: UserPersonalInfoEncryptedEntity;
  readonly #contactsPlain?: UserContactsPlainEntity;
  readonly #contactsEncrypted?: UserContactsEncryptedEntity;
  readonly #contactsHashed?: UserContactsHashedEntity;
  readonly #passwordHashed?: UserPasswordHashedEntity;

  constructor(props: {
    id: string;
    encryptionSalt: string;
    updatedAt: Date;
    createdAt: Date;
    personalInfoPlain?: UserPersonalInfoPlainEntity;
    personalInfoEncrypted?: UserPersonalInfoEncryptedEntity;
    contactsPlain?: UserContactsPlainEntity;
    contactsEncrypted?: UserContactsEncryptedEntity;
    contactsHashed?: UserContactsHashedEntity;
    passwordHashed?: UserPasswordHashedEntity;
  }) {
    this.#id = props.id;
    this.#encryptionSalt = props.encryptionSalt;
    this.#updatedAt = props.updatedAt;
    this.#createdAt = props.createdAt;
    this.#personalInfoPlain = props.personalInfoPlain;
    this.#personalInfoEncrypted = props.personalInfoEncrypted;
    this.#contactsPlain = props.contactsPlain;
    this.#contactsEncrypted = props.contactsEncrypted;
    this.#contactsHashed = props.contactsHashed;
    this.#passwordHashed = props.passwordHashed;
  }

  get id(): string {
    return this.#id;
  }

  get encryptionSalt(): string {
    return this.#encryptionSalt;
  }

  get updatedAt(): Date {
    return this.#updatedAt;
  }

  get createdAt(): Date {
    return this.#createdAt;
  }

  get personalInfoPlain() {
    return this.#personalInfoPlain;
  }

  get personalInfoEncrypted() {
    return this.#personalInfoEncrypted;
  }

  get contactsPlain() {
    return this.#contactsPlain;
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

export class UserFindOneEntity {
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
