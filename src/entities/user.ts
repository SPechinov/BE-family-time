export class UserPersonalInfoPlainEntity {
  readonly #firstName: string;
  readonly #lastName?: string;

  constructor(props: { firstName: string; lastName?: string }) {
    this.#firstName = props.firstName;
    this.#lastName = props.lastName;
  }

  get firstName(): string {
    return this.#firstName;
  }

  get lastName(): string | undefined {
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

  get email(): string | undefined {
    return this.#email;
  }

  get phone(): string | undefined {
    return this.#phone;
  }
}

export class UserContactsEncryptedEntity extends UserContactsPlainEntity {}

export class UserContactsHashedEntity extends UserContactsPlainEntity {}

export class UserPasswordPlainEntity {
  readonly #password: string;

  constructor(hash: string) {
    this.#password = hash;
  }

  get hash(): string {
    return this.#password;
  }
}

export class UserPasswordHashedEntity extends UserPasswordPlainEntity {}

export class UserEntity {
  readonly #id: string;
  readonly #updatedAt: Date;
  readonly #createdAt: Date;
  readonly #personalInfoPlain?: UserPersonalInfoPlainEntity;
  readonly #personalInfoEncrypted?: UserPersonalInfoEncryptedEntity;
  readonly #contactsPlain?: UserContactsPlainEntity;
  readonly #contactsEncrypted?: UserContactsEncryptedEntity;
  readonly #passwordHashed?: UserPasswordHashedEntity;

  constructor(props: {
    id: string;
    updatedAt: Date;
    createdAt: Date;
    personalInfoPlain?: UserPersonalInfoPlainEntity;
    personalInfoEncrypted?: UserPersonalInfoEncryptedEntity;
    contactsPlain?: UserContactsPlainEntity;
    contactsEncrypted?: UserContactsEncryptedEntity;
    passwordHashed?: UserPasswordHashedEntity;
  }) {
    this.#id = props.id;
    this.#updatedAt = props.updatedAt;
    this.#createdAt = props.createdAt;
    this.#personalInfoPlain = props.personalInfoPlain;
    this.#personalInfoEncrypted = props.personalInfoEncrypted;
    this.#contactsPlain = props.contactsPlain;
    this.#contactsEncrypted = props.contactsEncrypted;
    this.#passwordHashed = props.passwordHashed;
  }

  get id(): string {
    return this.#id;
  }

  get updatedAt(): Date {
    return this.#updatedAt;
  }

  get createdAt(): Date {
    return this.#createdAt;
  }

  get personalInfoPlain(): UserPersonalInfoPlainEntity | undefined {
    return this.#personalInfoPlain;
  }

  get personalInfoEncrypted(): UserPersonalInfoEncryptedEntity | undefined {
    return this.#personalInfoEncrypted;
  }

  get contactsPlain(): UserContactsPlainEntity | undefined {
    return this.#contactsPlain;
  }

  get contactsEncrypted(): UserContactsEncryptedEntity | undefined {
    return this.#contactsEncrypted;
  }

  get passwordHashed(): UserPasswordHashedEntity | undefined {
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

  get personalInfoPlain(): UserPersonalInfoPlainEntity | undefined {
    return this.#personalInfoPlain;
  }

  get contactsPlain(): UserContactsPlainEntity | undefined {
    return this.#contactsPlain;
  }

  get passwordPlain(): UserPasswordPlainEntity | undefined {
    return this.#passwordPlain;
  }
}
