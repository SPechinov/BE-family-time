import { UserId } from './user';
import { GroupId } from './group';
import { UUID } from 'node:crypto';

export type CalendarEventId = UUID & { readonly __brand: 'CalendarEventId' };
export type CalendarEventType = 'birthday' | 'vacation' | 'holiday';
export type CalendarEventIterationType = 'oneTime' | 'weekly' | 'monthly' | 'yearly';

export type CalendarEventRecurrencePattern =
  | { type: 'weekly'; dayOfWeek: number }
  | { type: 'monthly'; dayOfMonth: number };

interface Period {
  startDate?: Date;
  endDate?: Date;
}

export class CalendarEventEntity {
  readonly #id: CalendarEventId;
  readonly #groupId: GroupId;
  readonly #creatorUserId?: UserId;
  readonly #title: string;
  readonly #description?: string;
  readonly #eventType: CalendarEventType;
  readonly #iterationType: CalendarEventIterationType;
  readonly #startDate: Date;
  readonly #endDate?: Date;
  readonly #recurrencePattern?: CalendarEventRecurrencePattern;
  readonly #createdAt: Date;

  constructor(props: {
    id: CalendarEventId;
    groupId: GroupId;
    creatorUserId?: UserId;
    title: string;
    description?: string;
    eventType: CalendarEventType;
    iterationType: CalendarEventIterationType;
    startDate: Date;
    endDate?: Date;
    recurrencePattern?: CalendarEventRecurrencePattern;
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

export class CalendarEventCreateEntity {
  readonly #groupId: GroupId;
  readonly #creatorUserId: UserId;
  readonly #title: string;
  readonly #description?: string;
  readonly #eventType: CalendarEventType;
  readonly #iterationType: CalendarEventIterationType;
  readonly #startDate: Date;
  readonly #endDate?: Date;
  readonly #recurrencePattern?: CalendarEventRecurrencePattern;

  constructor(props: {
    groupId: GroupId;
    creatorUserId: UserId;
    title: string;
    description?: string;
    eventType: CalendarEventType;
    iterationType: CalendarEventIterationType;
    startDate: Date;
    endDate?: Date;
    recurrencePattern?: CalendarEventRecurrencePattern;
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

export class CalendarEventPatchOneEntity {
  readonly #title?: string;
  readonly #description?: string | null;
  readonly #eventType?: CalendarEventType;
  readonly #iterationType?: CalendarEventIterationType;
  readonly #startDate?: Date;
  readonly #endDate?: Date | null;
  readonly #recurrencePattern?: CalendarEventRecurrencePattern | null;

  constructor(props: {
    title?: string;
    description?: string | null;
    eventType?: CalendarEventType;
    iterationType?: CalendarEventIterationType;
    startDate?: Date;
    endDate?: Date | null;
    recurrencePattern?: CalendarEventRecurrencePattern | null;
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
  readonly #period?: Period;

  constructor(props: {
    ids?: CalendarEventId[];
    groupId?: GroupId;
    creatorUserId?: UserId;
    eventType?: CalendarEventType;
    period?: Period;
  }) {
    this.#ids = props.ids;
    this.#groupId = props.groupId;
    this.#creatorUserId = props.creatorUserId;
    this.#eventType = props.eventType;
    this.#period = props.period;
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

  get period() {
    return this.#period;
  }
}
