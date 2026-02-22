import { UUID } from 'node:crypto';

export class UsersGroupsEntity {
  readonly #userId: UUID;
  readonly #groupId: UUID;
  readonly #isOwner: boolean;
  readonly #createdAt: Date;

  constructor(props: { userId: UUID; groupId: UUID; isOwner: boolean; createdAt: Date }) {
    this.#userId = props.userId;
    this.#groupId = props.groupId;
    this.#isOwner = props.isOwner;
    this.#createdAt = props.createdAt;
  }

  get userId() {
    return this.#userId;
  }

  get groupId() {
    return this.#groupId;
  }

  get isOwner() {
    return this.#isOwner;
  }

  get createdAt() {
    return this.#createdAt;
  }
}

export class UsersGroupsCreateEntity {
  readonly #userId: UUID;
  readonly #groupId: UUID;
  readonly #isOwner: boolean;

  constructor(props: { userId: UUID; groupId: UUID; isOwner: boolean }) {
    this.#userId = props.userId;
    this.#groupId = props.groupId;
    this.#isOwner = props.isOwner;
  }

  get userId() {
    return this.#userId;
  }

  get groupId() {
    return this.#groupId;
  }

  get isOwner() {
    return this.#isOwner;
  }
}

export class UsersGroupsFindOneEntity {
  readonly #userId?: UUID;
  readonly #groupId?: UUID;
  readonly #isOwner?: boolean;

  constructor(props: { userId?: UUID; groupId?: UUID; isOwner?: boolean }) {
    this.#userId = props.userId;
    this.#groupId = props.groupId;
    this.#isOwner = props.isOwner;
  }

  get userId() {
    return this.#userId;
  }

  get groupId() {
    return this.#groupId;
  }

  get isOwner() {
    return this.#isOwner;
  }
}

export class UsersGroupsDeleteEntity {
  readonly #userId: UUID;
  readonly #groupId: UUID;

  constructor(props: { userId: UUID; groupId: UUID }) {
    this.#userId = props.userId;
    this.#groupId = props.groupId;
  }

  get userId() {
    return this.#userId;
  }

  get groupId() {
    return this.#groupId;
  }
}
