export class UserPersonalInfoEntity {
  readonly #firstName: string;
  readonly #lastName?: string;

  constructor(props: { firstName: string; lastName?: string }) {
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

export class UserContactsPlainEntity {
  readonly #email?: string;
  readonly #phone?: string;

  constructor(props: { email?: string; phone?: string }) {
    this.#email = props.email ? this.#normalizeEmail(props.email) : undefined;
    this.#phone = props.phone ? this.#normalizePhone(props.phone) : undefined;
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

  #normalizeEmail(email: string) {
    return email.toLowerCase().trim();
  }

  #normalizePhone(phone: string) {
    return phone.replace(/\D/g, '');
  }
}

export class UserContactsHashedEntity extends UserContactsPlainEntity {}

export class UserContactsEncryptedEntity extends UserContactsPlainEntity {}

export class UserContactsDecryptedEntity extends UserContactsPlainEntity {}

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
