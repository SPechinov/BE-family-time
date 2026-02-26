import { UUID } from 'node:crypto';
import { UserId } from './user';
import { GroupId } from './group';

export type EventId = UUID;
export type EventType = 'birthday' | 'vacation' | 'monthly' | 'holiday';
export type EventIterationType = 'oneTime' | 'weekly' | 'monthly' | 'yearly';

export type EventRecurrencePattern = { type: 'weekly'; dayOfWeek: number } | { type: 'monthly'; dayOfMonth: number };

export class EventEntity {
  readonly #id: EventId;
  readonly #groupId: GroupId;
  readonly #creatorUserId?: UserId;
  readonly #title: string;
  readonly #description?: string;
  readonly #eventType: EventType;
  readonly #iterationType: EventIterationType;
  readonly #startDate: Date;
  readonly #endDate?: Date;
  readonly #recurrencePattern?: EventRecurrencePattern;
  readonly #createdAt: Date;

  constructor(props: {
    id: EventId;
    groupId: GroupId;
    creatorUserId?: UserId;
    title: string;
    description?: string;
    eventType: EventType;
    iterationType: EventIterationType;
    startDate: Date;
    endDate?: Date;
    recurrencePattern?: EventRecurrencePattern;
    createdAt: Date;
  }) {
    this.#id = props.id;
    this.#groupId = props.groupId;
    this.#creatorUserId = props.creatorUserId;
    this.#title = props.title;
    this.#description = props.description;
    this.#eventType = props.eventType;
    this.#iterationType = props.iterationType;
    this.#startDate = props.startDate;
    this.#endDate = props.endDate;
    this.#recurrencePattern = props.recurrencePattern;
    this.#createdAt = props.createdAt;
  }

  get id() {
    return this.#id;
  }

  get groupId() {
    return this.#groupId;
  }

  get creatorUserId() {
    return this.#creatorUserId;
  }

  get title() {
    return this.#title;
  }

  get description() {
    return this.#description;
  }

  get eventType() {
    return this.#eventType;
  }

  get iterationType() {
    return this.#iterationType;
  }

  get startDate() {
    return this.#startDate;
  }

  get endDate() {
    return this.#endDate;
  }

  get recurrencePattern() {
    return this.#recurrencePattern;
  }

  get createdAt(): Date {
    return this.#createdAt;
  }
}

export class EventCreateEntity {
  readonly #groupId: GroupId;
  readonly #creatorUserId: UserId;
  readonly #title: string;
  readonly #description?: string;
  readonly #eventType: EventType;
  readonly #iterationType: EventIterationType;
  readonly #startDate: Date;
  readonly #endDate?: Date;
  readonly #recurrencePattern?: EventRecurrencePattern;

  constructor(props: {
    groupId: GroupId;
    creatorUserId: UserId;
    title: string;
    description?: string;
    eventType: EventType;
    iterationType: EventIterationType;
    startDate: Date;
    endDate?: Date;
    recurrencePattern?: EventRecurrencePattern;
  }) {
    this.#groupId = props.groupId;
    this.#creatorUserId = props.creatorUserId;
    this.#title = props.title;
    this.#description = props.description;
    this.#eventType = props.eventType;
    this.#iterationType = props.iterationType;
    this.#startDate = props.startDate;
    this.#endDate = props.endDate;
    this.#recurrencePattern = props.recurrencePattern;
  }

  get groupId() {
    return this.#groupId;
  }

  get creatorUserId() {
    return this.#creatorUserId;
  }

  get title() {
    return this.#title;
  }

  get description() {
    return this.#description;
  }

  get eventType() {
    return this.#eventType;
  }

  get iterationType() {
    return this.#iterationType;
  }

  get startDate() {
    return this.#startDate;
  }

  get endDate() {
    return this.#endDate;
  }

  get recurrencePattern() {
    return this.#recurrencePattern;
  }
}

export class EventPatchOneEntity {
  readonly #title?: string;
  readonly #description?: string | null;
  readonly #eventType?: EventType;
  readonly #iterationType?: EventIterationType;
  readonly #startDate?: Date;
  readonly #endDate?: Date | null;
  readonly #recurrencePattern?: EventRecurrencePattern | null;

  constructor(props: {
    title?: string;
    description?: string | null;
    eventType?: EventType;
    iterationType?: EventIterationType;
    startDate?: Date;
    endDate?: Date | null;
    recurrencePattern?: EventRecurrencePattern | null;
  }) {
    this.#title = props.title;
    this.#description = props.description;
    this.#eventType = props.eventType;
    this.#iterationType = props.iterationType;
    this.#startDate = props.startDate;
    this.#endDate = props.endDate;
    this.#recurrencePattern = props.recurrencePattern;
  }

  get title() {
    return this.#title;
  }

  get description() {
    return this.#description;
  }

  get eventType() {
    return this.#eventType;
  }

  get iterationType() {
    return this.#iterationType;
  }

  get startDate() {
    return this.#startDate;
  }

  get endDate() {
    return this.#endDate;
  }

  get recurrencePattern() {
    return this.#recurrencePattern;
  }
}

export class EventFindOneEntity {
  readonly #id?: EventId;

  constructor(props: { id?: EventId }) {
    this.#id = props.id;
  }

  get id() {
    return this.#id;
  }
}

export class EventFindManyEntity {
  readonly #ids?: EventId[];
  readonly #groupId?: GroupId;
  readonly #creatorUserId?: UserId;
  readonly #eventType?: EventType;

  constructor(props: { ids?: EventId[]; groupId?: GroupId; creatorUserId?: UserId; eventType?: EventType }) {
    this.#ids = props.ids;
    this.#groupId = props.groupId;
    this.#creatorUserId = props.creatorUserId;
    this.#eventType = props.eventType;
  }

  get ids() {
    return this.#ids;
  }

  get groupId() {
    return this.#groupId;
  }

  get creatorUserId() {
    return this.#creatorUserId;
  }

  get eventType() {
    return this.#eventType;
  }
}
