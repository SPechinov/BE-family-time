import { UserId } from './user';
import { GroupId } from './group';

export class GroupsUsersEntity {
  readonly #userId: UserId;
  readonly #groupId: GroupId;
  readonly #isOwner: boolean;
  readonly #createdAt: Date;

  constructor(props: { userId: UserId; groupId: GroupId; isOwner: boolean; createdAt: Date }) {
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

export class GroupsUsersCreateEntity {
  readonly #userId: UserId;
  readonly #groupId: GroupId;
  readonly #isOwner: boolean;

  constructor(props: { userId: UserId; groupId: GroupId; isOwner: boolean }) {
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

export class GroupsUsersFindOneEntity {
  readonly #userId?: UserId;
  readonly #groupId?: GroupId;
  readonly #isOwner?: boolean;

  constructor(props: { userId?: UserId; groupId?: GroupId; isOwner?: boolean }) {
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

export class GroupsUsersFindManyEntity {
  readonly #userId?: UserId;
  readonly #groupId?: GroupId;
  readonly #isOwner?: boolean;

  constructor(props: { userId?: UserId; groupId?: GroupId; isOwner?: boolean }) {
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

export class GroupsUsersDeleteOneEntity {
  readonly #userId: UserId;
  readonly #groupId: GroupId;

  constructor(props: { userId: UserId; groupId: GroupId }) {
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
