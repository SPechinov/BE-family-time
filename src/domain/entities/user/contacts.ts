class UserContactsEntity {
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

export class UserContactsPlainEntity extends UserContactsEntity {
  constructor(props: { email?: string; phone?: string }) {
    super({
      email: props.email ? UserContactsPlainEntity.normalizeEmail(props.email) : undefined,
      phone: props.phone ? UserContactsPlainEntity.normalizePhone(props.phone) : undefined,
    });
  }

  static normalizeEmail(email: string) {
    return email.toLowerCase().trim();
  }

  static normalizePhone(phone: string) {
    return phone.replace(/\D/g, '');
  }
}

export class UserContactsHashedEntity extends UserContactsEntity {}

export class UserContactsEncryptedEntity extends UserContactsEntity {}

export class UserContactsDecryptedEntity extends UserContactsEntity {}

export class UserContactsPatchEntity {
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
}

export class UserContactsHashedPatchEntity extends UserContactsPatchEntity {}

export class UserContactsEncryptedPatchEntity extends UserContactsPatchEntity {}
