import { UUID } from 'node:crypto';
import { UserId } from './user';
import { GroupId } from './group';

export type CalendarEventId = UUID;
export type CalendarEventType = 'one-time' | 'yearly' | 'weekly' | 'monthly' | 'work-schedule';
export type CalendarEventIterationType = 'oneTime' | 'weekly' | 'monthly' | 'yearly';

export type CalendarEventRecurrencePattern =
  | { type: 'weekly'; weekdays: number[] }
  | { type: 'monthly'; dayOfMonth: number }
  | { type: 'work-schedule'; shiftPattern: number[]; startDate: string; shiftDuration?: number };

export class CalendarEventEntity {
  readonly #id: CalendarEventId;
  readonly #groupId: GroupId;
  readonly #creatorUserId: UserId;
  readonly #title: string;
  readonly #description?: string;
  readonly #eventType: CalendarEventType;
  readonly #startDate: Date;
  readonly #endDate: Date;
  readonly #isAllDay: boolean;
  readonly #recurrencePattern?: CalendarEventRecurrencePattern;
  readonly #parentEventId?: CalendarEventId;
  readonly #isException: boolean;
  readonly #exceptionDate?: Date;
  readonly #createdAt: Date;
  readonly #updatedAt: Date;

  constructor(props: {
    id: CalendarEventId;
    groupId: GroupId;
    creatorUserId: UserId;
    title: string;
    description?: string;
    eventType: CalendarEventType;
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    recurrencePattern?: CalendarEventRecurrencePattern;
    parentEventId?: CalendarEventId;
    isException: boolean;
    exceptionDate?: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.#id = props.id;
    this.#groupId = props.groupId;
    this.#creatorUserId = props.creatorUserId;
    this.#title = props.title;
    this.#description = props.description;
    this.#eventType = props.eventType;
    this.#startDate = props.startDate;
    this.#endDate = props.endDate;
    this.#isAllDay = props.isAllDay;
    this.#recurrencePattern = props.recurrencePattern;
    this.#parentEventId = props.parentEventId;
    this.#isException = props.isException;
    this.#exceptionDate = props.exceptionDate;
    this.#createdAt = props.createdAt;
    this.#updatedAt = props.updatedAt;
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

  get startDate() {
    return this.#startDate;
  }

  get endDate() {
    return this.#endDate;
  }

  get isAllDay() {
    return this.#isAllDay;
  }

  get recurrencePattern() {
    return this.#recurrencePattern;
  }

  get parentEventId() {
    return this.#parentEventId;
  }

  get isException() {
    return this.#isException;
  }

  get exceptionDate() {
    return this.#exceptionDate;
  }

  get createdAt(): Date {
    return this.#createdAt;
  }

  get updatedAt(): Date {
    return this.#updatedAt;
  }
}

export class CalendarEventCreateEntity {
  readonly #groupId: GroupId;
  readonly #creatorUserId: UserId;
  readonly #title: string;
  readonly #description?: string;
  readonly #eventType: CalendarEventType;
  readonly #startDate: Date;
  readonly #endDate: Date;
  readonly #isAllDay: boolean;
  readonly #recurrencePattern?: CalendarEventRecurrencePattern;

  constructor(props: {
    groupId: GroupId;
    creatorUserId: UserId;
    title: string;
    description?: string;
    eventType: CalendarEventType;
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    recurrencePattern?: CalendarEventRecurrencePattern;
  }) {
    this.#groupId = props.groupId;
    this.#creatorUserId = props.creatorUserId;
    this.#title = props.title;
    this.#description = props.description;
    this.#eventType = props.eventType;
    this.#startDate = props.startDate;
    this.#endDate = props.endDate;
    this.#isAllDay = props.isAllDay;
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

  get startDate() {
    return this.#startDate;
  }

  get endDate() {
    return this.#endDate;
  }

  get isAllDay() {
    return this.#isAllDay;
  }

  get recurrencePattern() {
    return this.#recurrencePattern;
  }
}

export class CalendarEventPatchEntity {
  readonly #title?: string;
  readonly #description?: string | null;
  readonly #eventType?: CalendarEventType;
  readonly #startDate?: Date;
  readonly #endDate?: Date;
  readonly #isAllDay?: boolean;
  readonly #recurrencePattern?: CalendarEventRecurrencePattern | null;

  constructor(props: {
    title?: string;
    description?: string | null;
    eventType?: CalendarEventType;
    startDate?: Date;
    endDate?: Date;
    isAllDay?: boolean;
    recurrencePattern?: CalendarEventRecurrencePattern | null;
  }) {
    this.#title = props.title;
    this.#description = props.description;
    this.#eventType = props.eventType;
    this.#startDate = props.startDate;
    this.#endDate = props.endDate;
    this.#isAllDay = props.isAllDay;
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

  get startDate() {
    return this.#startDate;
  }

  get endDate() {
    return this.#endDate;
  }

  get isAllDay() {
    return this.#isAllDay;
  }

  get recurrencePattern() {
    return this.#recurrencePattern;
  }
}

export class CalendarEventFindOneEntity {
  readonly #id?: CalendarEventId;

  constructor(props: { id?: CalendarEventId }) {
    this.#id = props.id;
  }

  get id() {
    return this.#id;
  }
}

export class CalendarEventFindManyEntity {
  readonly #ids?: CalendarEventId[];
  readonly #groupId?: GroupId;
  readonly #creatorUserId?: UserId;
  readonly #eventType?: CalendarEventType;

  constructor(props: {
    ids?: CalendarEventId[];
    groupId?: GroupId;
    creatorUserId?: UserId;
    eventType?: CalendarEventType;
  }) {
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

// Type alias for backward compatibility with controller imports
export type RecurrencePattern = CalendarEventRecurrencePattern;
