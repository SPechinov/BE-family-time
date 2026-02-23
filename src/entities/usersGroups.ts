import { UUID } from 'node:crypto';

export class UsersGroupsEntity {
  readonly #userId: UUID;
  readonly #groupId: UUID;
  readonly #isOwner: boolean;
  readonly #createdAt: Date;
  readonly #deleted: boolean;

  constructor(props: { userId: UUID; groupId: UUID; isOwner: boolean; createdAt: Date; deleted: boolean }) {
    this.#userId = props.userId;
    this.#groupId = props.groupId;
    this.#isOwner = props.isOwner;
    this.#createdAt = props.createdAt;
    this.#deleted = props.deleted;
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

  get deleted() {
    return this.#deleted;
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
  readonly #deleted?: boolean;

  constructor(props: { userId?: UUID; groupId?: UUID; isOwner?: boolean; deleted?: boolean }) {
    this.#userId = props.userId;
    this.#groupId = props.groupId;
    this.#isOwner = props.isOwner;
    this.#deleted = props.deleted;
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

  get deleted() {
    return this.#deleted;
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

export class UsersGroupsFindManyEntity {
  readonly #userId?: UUID;
  readonly #groupId?: UUID;
  readonly #deleted?: boolean;
  readonly #isOwner?: boolean;

  constructor(props: { userId?: UUID; groupId?: UUID; deleted?: boolean; isOwner?: boolean }) {
    this.#userId = props.userId;
    this.#groupId = props.groupId;
    this.#deleted = props.deleted;
    this.#isOwner = props.isOwner;
  }

  get userId() {
    return this.#userId;
  }

  get groupId() {
    return this.#groupId;
  }

  get deleted() {
    return this.#deleted;
  }

  get isOwner() {
    return this.#isOwner;
  }
}
