import { UUID } from 'node:crypto';
export type GroupId = UUID & { readonly __brand: 'GroupId' };

export class GroupName {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  static create(value: string): GroupName {
    return new GroupName(value);
  }

  static fromOptional(value?: string): string | undefined {
    if (value === undefined) return undefined;
    return GroupName.create(value).value;
  }

  get value(): string {
    return this.#value;
  }
}

export class GroupDescription {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  static create(value: string): GroupDescription {
    return new GroupDescription(value);
  }

  static fromOptional(value?: string): string | undefined {
    if (value === undefined) return undefined;
    return GroupDescription.create(value).value;
  }

  static fromNullableOptional(value?: string | null): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return GroupDescription.create(value).value;
  }

  get value(): string {
    return this.#value;
  }
}

export class GroupEntity {
  readonly #id: GroupId;
  readonly #name: string;
  readonly #description?: string;
  readonly #createdAt: Date;

  constructor(props: { id: GroupId; name: string; description?: string; createdAt: Date }) {
    this.#id = props.id;
    this.#name = GroupName.create(props.name).value;
    this.#description = GroupDescription.fromOptional(props.description);
    this.#createdAt = props.createdAt;
  }

  get id() {
    return this.#id;
  }

  get name() {
    return this.#name;
  }

  get description() {
    return this.#description;
  }

  get createdAt() {
    return this.#createdAt;
  }
}

export class GroupCreateEntity {
  readonly #name: string;
  readonly #description?: string;

  constructor(props: { name: string; description?: string }) {
    this.#name = GroupName.create(props.name).value;
    this.#description = GroupDescription.fromOptional(props.description);
  }
  get name() {
    return this.#name;
  }

  get description() {
    return this.#description;
  }
}

export class GroupFindOneEntity {
  readonly #id?: GroupId;

  constructor(props: { id?: GroupId }) {
    this.#id = props.id;
  }

  get id() {
    return this.#id;
  }
}

export class GroupFindManyEntity {
  readonly #ids?: GroupId[];
  readonly #name?: string;

  constructor(props: { ids?: GroupId[]; name?: string }) {
    this.#ids = props.ids;
    this.#name = props.name;
  }

  get ids() {
    return this.#ids;
  }

  get name() {
    return this.#name;
  }
}

export class GroupPatchOneEntity {
  readonly #name?: string;
  readonly #description?: string | null;

  constructor(props: { name?: string; description?: string | null }) {
    this.#name = GroupName.fromOptional(props.name);
    this.#description = GroupDescription.fromNullableOptional(props.description);
  }
  get name() {
    return this.#name;
  }

  get description() {
    return this.#description;
  }
}
