import { UUID } from 'node:crypto';
export type UserId = UUID & { readonly __brand: 'UserId' };

export const USER_LANGUAGES = ['ru', 'en'] as const;

export type UserLanguageUnion = (typeof USER_LANGUAGES)[number];

export class UserName {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  static create(value: string): UserName {
    return new UserName(value);
  }

  get value(): string {
    return this.#value;
  }
}

export class UserTimeZone {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  static create(value: string): UserTimeZone {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return new UserTimeZone(value);
  }

  static fromOptional(value?: string): string | undefined {
    if (value === undefined) return undefined;
    return UserTimeZone.create(value).value;
  }

  get value(): string {
    return this.#value;
  }
}

export class UserLanguage {
  readonly #value: UserLanguageUnion;

  private constructor(value: UserLanguageUnion) {
    this.#value = value;
  }

  static create(value: UserLanguageUnion): UserLanguage {
    return new UserLanguage(value);
  }

  static fromOptional(value?: UserLanguageUnion): UserLanguageUnion | undefined {
    if (value === undefined) return undefined;
    return UserLanguage.create(value).value;
  }

  get value(): UserLanguageUnion {
    return this.#value;
  }
}

export class UserPersonalInfoPlainEntity {
  readonly #firstName?: string | null;
  readonly #lastName?: string | null;
  readonly #dateOfBirth?: Date | null;

  constructor(props: { firstName?: string | null; lastName?: string | null; dateOfBirth?: Date | null }) {
    this.#firstName = props.firstName;
    this.#lastName = props.lastName;
    this.#dateOfBirth = props.dateOfBirth;
  }

  get firstName() {
    return this.#firstName;
  }

  get lastName() {
    return this.#lastName;
  }

  get dateOfBirth() {
    return this.#dateOfBirth;
  }
}

export class UserPersonalInfoEncryptedEntity {
  readonly #firstName?: string | null;
  readonly #lastName?: string | null;
  readonly #dateOfBirth?: string | null;

  constructor(props: { firstName?: string | null; lastName?: string | null; dateOfBirth?: string | null }) {
    this.#firstName = props.firstName;
    this.#lastName = props.lastName;
    this.#dateOfBirth = props.dateOfBirth;
  }

  get firstName() {
    return this.#firstName;
  }

  get lastName() {
    return this.#lastName;
  }

  get dateOfBirth() {
    return this.#dateOfBirth;
  }
}

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

  constructor(password: string) {
    this.#password = password;
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
  timeZone: string;
  language: UserLanguageUnion;
  personalInfoEncrypted?: UserPersonalInfoEncryptedEntity;
  contactsEncrypted?: UserContactsEncryptedEntity;
  contactsHashed?: UserContactsHashedEntity;
  passwordHashed?: UserPasswordHashedEntity;
}
export class UserEntity extends UserBaseEntity {
  readonly #encryptionSalt: string;
  readonly #timeZone: string;
  readonly #language: UserLanguageUnion;
  readonly #personalInfoEncrypted?: UserPersonalInfoEncryptedEntity;
  readonly #contactsEncrypted?: UserContactsEncryptedEntity;
  readonly #contactsHashed?: UserContactsHashedEntity;
  readonly #passwordHashed?: UserPasswordHashedEntity;

  constructor(props: UserEntityProps) {
    super(props);
    this.#encryptionSalt = props.encryptionSalt;
    this.#timeZone = props.timeZone;
    this.#language = props.language;
    this.#personalInfoEncrypted = props.personalInfoEncrypted;
    this.#contactsEncrypted = props.contactsEncrypted;
    this.#contactsHashed = props.contactsHashed;
    this.#passwordHashed = props.passwordHashed;
  }

  get encryptionSalt(): string {
    return this.#encryptionSalt;
  }

  get timeZone(): string {
    return this.#timeZone;
  }

  get language(): UserLanguageUnion {
    return this.#language;
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
  timeZone: string;
  language: UserLanguageUnion;
  personalInfo?: UserPersonalInfoPlainEntity;
  contacts?: UserContactsPlainEntity;
}

export class UserPlainEntity extends UserBaseEntity {
  readonly #timeZone: string;
  readonly #language: UserLanguageUnion;
  readonly #personalInfo?: UserPersonalInfoPlainEntity;
  readonly #contacts?: UserContactsPlainEntity;

  constructor(props: UserPlainEntityProps) {
    super(props);
    this.#timeZone = props.timeZone;
    this.#language = props.language;
    this.#personalInfo = props.personalInfo;
    this.#contacts = props.contacts;
  }

  get timeZone() {
    return this.#timeZone;
  }

  get language() {
    return this.#language;
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
  readonly #timeZone: string;
  readonly #language: UserLanguageUnion;

  constructor(props: {
    timeZone: string;
    language: UserLanguageUnion;
    personalInfoPlain?: UserPersonalInfoPlainEntity;
    contactsPlain?: UserContactsPlainEntity;
    passwordPlain?: UserPasswordPlainEntity;
  }) {
    this.#timeZone = UserTimeZone.create(props.timeZone).value;
    this.#language = UserLanguage.create(props.language).value;
    this.#personalInfoPlain = props.personalInfoPlain;
    this.#contactsPlain = props.contactsPlain;
    this.#passwordPlain = props.passwordPlain;
  }

  get timeZone() {
    return this.#timeZone;
  }

  get language() {
    return this.#language;
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
  readonly #timeZone: string;
  readonly #language: UserLanguageUnion;
  readonly #personalInfoEncrypted?: UserPersonalInfoEncryptedEntity;
  readonly #contactsHashed?: UserContactsHashedEntity;
  readonly #contactsEncrypted?: UserContactsEncryptedEntity;
  readonly #passwordHashed?: UserPasswordHashedEntity;

  constructor(props: {
    encryptionSalt: string;
    timeZone: string;
    language: UserLanguageUnion;
    personalInfoEncrypted?: UserPersonalInfoEncryptedEntity;
    contactsHashed?: UserContactsHashedEntity;
    contactsEncrypted?: UserContactsEncryptedEntity;
    passwordHashed?: UserPasswordHashedEntity;
  }) {
    this.#encryptionSalt = props.encryptionSalt;
    this.#timeZone = props.timeZone;
    this.#language = props.language;
    this.#personalInfoEncrypted = props.personalInfoEncrypted;
    this.#contactsHashed = props.contactsHashed;
    this.#contactsEncrypted = props.contactsEncrypted;
    this.#passwordHashed = props.passwordHashed;
  }

  get encryptionSalt() {
    return this.#encryptionSalt;
  }

  get timeZone() {
    return this.#timeZone;
  }

  get language() {
    return this.#language;
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
  readonly #timeZone?: string;
  readonly #language?: UserLanguageUnion;

  constructor(props: {
    personalInfoPlain?: UserPersonalInfoPlainEntity | null;
    contactsPlain?: UserContactsPlainEntity | null;
    passwordPlain?: UserPasswordPlainEntity | null;
    timeZone?: string;
    language?: UserLanguageUnion;
  }) {
    this.#personalInfoPlain = props.personalInfoPlain;
    this.#contactsPlain = props.contactsPlain;
    this.#passwordPlain = props.passwordPlain;
    this.#timeZone = UserTimeZone.fromOptional(props.timeZone);
    this.#language = UserLanguage.fromOptional(props.language);
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

  get timeZone() {
    return this.#timeZone;
  }

  get language() {
    return this.#language;
  }
}

export class UserPatchOneEntity {
  readonly #personalInfoEncrypted?: UserPersonalInfoEncryptedEntity | null;
  readonly #contactsHashed?: UserContactsHashedEntity | null;
  readonly #contactsEncrypted?: UserContactsEncryptedEntity | null;
  readonly #passwordHashed?: UserPasswordHashedEntity | null;
  readonly #timeZone?: string;
  readonly #language?: UserLanguageUnion;

  constructor(props: {
    personalInfoEncrypted?: UserPersonalInfoEncryptedEntity | null;
    contactsHashed?: UserContactsHashedEntity | null;
    contactsEncrypted?: UserContactsEncryptedEntity | null;
    passwordHashed?: UserPasswordHashedEntity | null;
    timeZone?: string;
    language?: UserLanguageUnion;
  }) {
    this.#personalInfoEncrypted = props.personalInfoEncrypted;
    this.#contactsHashed = props.contactsHashed;
    this.#contactsEncrypted = props.contactsEncrypted;
    this.#passwordHashed = props.passwordHashed;
    this.#timeZone = props.timeZone;
    this.#language = props.language;
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

  get timeZone() {
    return this.#timeZone;
  }

  get language() {
    return this.#language;
  }
}
