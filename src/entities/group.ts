import { UUID } from 'node:crypto';

export class GroupUser {
  readonly #isOwner: boolean;
  readonly #id: UUID;

  constructor(props: { isOwner: boolean; id: UUID }) {
    this.#isOwner = props.isOwner;
    this.#id = props.id;
  }

  get id() {
    return this.#id;
  }

  get isOwner() {
    return this.#isOwner;
  }
}

interface GroupEntityProps {
  id: UUID;
  name: string;
  description?: string;
  createdAt: Date;
  deleted: boolean;
  deletedAt?: Date;
}

export class GroupEntity {
  readonly #id: UUID;
  readonly #name: string;
  readonly #description?: string;
  readonly #createdAt: Date;
  readonly #deleted: boolean;
  readonly #deletedAt?: Date;

  constructor(props: GroupEntityProps) {
    this.#id = props.id;
    this.#name = props.name;
    this.#description = props.description;
    this.#createdAt = props.createdAt;
    this.#deleted = props.deleted;
    this.#deletedAt = props.deletedAt;
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

  get deleted() {
    return this.#deleted;
  }

  get deletedAt() {
    return this.#deletedAt;
  }
}

export class GroupWithUsersEntity extends GroupEntity {
  readonly #users?: GroupUser[];

  constructor(props: GroupEntityProps & { users: GroupUser[] }) {
    super(props);
    this.#users = props.users;
  }

  get users() {
    return this.#users;
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
  readonly #id: UUID;
  readonly #deleted?: boolean;

  constructor(props: { id: UUID; deleted?: boolean }) {
    this.#id = props.id;
  }

  get id() {
    return this.#id;
  }

  get deleted() {
    return this.#deleted;
  }
}

export class GroupFindAllEntity {
  readonly #userId: UUID;
  readonly #deleted: boolean;

  constructor(props: { userId: UUID; deleted?: boolean }) {
    this.#userId = props.userId;
    this.#deleted = false;
  }

  get userId() {
    return this.#userId;
  }

  get deleted() {
    return this.#deleted;
  }
}

export class GroupPatchOneEntity {
  readonly #name?: string;
  readonly #description?: string | null;
  readonly #delete?: boolean;

  constructor(props: { name: string; description?: string; delete?: boolean }) {
    this.#name = props.name;
    this.#description = props.description;
    this.#delete = props.delete;
  }
  get name() {
    return this.#name;
  }

  get description() {
    return this.#description;
  }

  get delete() {
    return this.#delete;
  }
}
