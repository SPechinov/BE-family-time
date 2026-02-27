import { $brand } from 'zod';
export type GroupId = string & $brand<'GroupId'>;

export class GroupEntity {
  readonly #id: GroupId;
  readonly #name: string;
  readonly #description?: string;
  readonly #createdAt: Date;

  constructor(props: { id: GroupId; name: string; description?: string; createdAt: Date }) {
    this.#id = props.id;
    this.#name = props.name;
    this.#description = props.description;
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
    this.#name = props.name;
    this.#description = props.description;
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
    this.#name = props.name;
    this.#description = props.description;
  }
  get name() {
    return this.#name;
  }

  get description() {
    return this.#description;
  }
}
