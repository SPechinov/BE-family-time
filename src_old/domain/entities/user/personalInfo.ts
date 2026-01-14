export class UserPersonalInfoEntity {
  readonly #firstName: string;
  readonly #lastName?: string;

  constructor(props: { firstName: string; lastName?: string }) {
    this.#firstName = props.firstName.trim();
    this.#lastName = props.lastName?.trim();
  }

  get firstName() {
    return this.#firstName;
  }

  get lastName() {
    return this.#lastName;
  }
}

export class UserPersonalInfoPatchEntity {
  readonly #firstName?: string | null;
  readonly #lastName?: string | null;

  constructor(props: { firstName?: string | null; lastName?: string | null }) {
    this.#firstName = props.firstName?.trim();
    this.#lastName = props.lastName?.trim();
  }

  get firstName() {
    return this.#firstName;
  }

  get lastName() {
    return this.#lastName;
  }
}
