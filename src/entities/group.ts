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
}

export class GroupEntity {
  readonly #id: UUID;
  readonly #name: string;
  readonly #description?: string;
  readonly #createdAt: Date;

  constructor(props: GroupEntityProps) {
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

export class GroupWithUsersEntity extends GroupEntity {
  readonly #users: GroupUser[];

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
  readonly #id?: UUID;

  constructor(props: { id?: UUID }) {
    this.#id = props.id;
  }

  get id() {
    return this.#id;
  }
}

export class GroupFindAllEntity {
  readonly #userId: UUID;

  constructor(props: { userId: UUID }) {
    this.#userId = props.userId;
  }

  get userId() {
    return this.#userId;
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
