import { UUID } from 'node:crypto';

export type CalendarEventType = 'one-time' | 'yearly' | 'weekly' | 'monthly' | 'work-schedule';

export type RecurrencePattern =
  | { type: 'weekly'; weekdays: number[] }
  | { type: 'monthly'; dayOfMonth: number }
  | { type: 'work-schedule'; shiftPattern: number[]; startDate: string; shiftDuration: number };

/**
 * Основная сущность события календаря
 */
export class CalendarEventEntity {
  readonly #id: UUID;
  readonly #groupId: UUID;
  readonly #creatorUserId: UUID;
  readonly #title: string;
  readonly #description?: string;
  readonly #eventType: CalendarEventType;
  readonly #startDate: Date;
  readonly #endDate: Date;
  readonly #isAllDay: boolean;
  readonly #recurrencePattern?: RecurrencePattern;
  readonly #parentEventId?: UUID;
  readonly #isException: boolean;
  readonly #exceptionDate?: Date;
  readonly #createdAt: Date;
  readonly #updatedAt: Date;

  constructor(props: {
    id: UUID;
    groupId: UUID;
    creatorUserId: UUID;
    title: string;
    description?: string;
    eventType: CalendarEventType;
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    recurrencePattern?: RecurrencePattern;
    parentEventId?: UUID;
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

  get id(): UUID {
    return this.#id;
  }
  get groupId(): UUID {
    return this.#groupId;
  }
  get creatorUserId(): UUID {
    return this.#creatorUserId;
  }
  get title(): string {
    return this.#title;
  }
  get description(): string | undefined {
    return this.#description;
  }
  get eventType(): CalendarEventType {
    return this.#eventType;
  }
  get startDate(): Date {
    return this.#startDate;
  }
  get endDate(): Date {
    return this.#endDate;
  }
  get isAllDay(): boolean {
    return this.#isAllDay;
  }
  get recurrencePattern(): RecurrencePattern | undefined {
    return this.#recurrencePattern;
  }
  get parentEventId(): UUID | undefined {
    return this.#parentEventId;
  }
  get isException(): boolean {
    return this.#isException;
  }
  get exceptionDate(): Date | undefined {
    return this.#exceptionDate;
  }
  get createdAt(): Date {
    return this.#createdAt;
  }
  get updatedAt(): Date {
    return this.#updatedAt;
  }
}

/**
 * Сущность для создания события
 */
export class CalendarEventCreateEntity {
  readonly #groupId: UUID;
  readonly #creatorUserId: UUID;
  readonly #title: string;
  readonly #description?: string;
  readonly #eventType: CalendarEventType;
  readonly #startDate: Date;
  readonly #endDate: Date;
  readonly #isAllDay: boolean;
  readonly #recurrencePattern?: RecurrencePattern;

  constructor(props: {
    groupId: UUID;
    creatorUserId: UUID;
    title: string;
    description?: string;
    eventType: CalendarEventType;
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    recurrencePattern?: RecurrencePattern;
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

  get groupId(): UUID {
    return this.#groupId;
  }
  get creatorUserId(): UUID {
    return this.#creatorUserId;
  }
  get title(): string {
    return this.#title;
  }
  get description(): string | undefined {
    return this.#description;
  }
  get eventType(): CalendarEventType {
    return this.#eventType;
  }
  get startDate(): Date {
    return this.#startDate;
  }
  get endDate(): Date {
    return this.#endDate;
  }
  get isAllDay(): boolean {
    return this.#isAllDay;
  }
  get recurrencePattern(): RecurrencePattern | undefined {
    return this.#recurrencePattern;
  }
}

/**
 * Сущность для поиска одного события
 */
export class CalendarEventFindOneEntity {
  readonly #id: UUID;

  constructor(props: { id: UUID }) {
    this.#id = props.id;
  }

  get id(): UUID {
    return this.#id;
  }
}

/**
 * Сущность для поиска множества событий
 */
export class CalendarEventFindManyEntity {
  readonly #groupId: UUID;
  readonly #startDate?: Date;
  readonly #endDate?: Date;
  readonly #eventType?: CalendarEventType;
  readonly #search?: string;

  constructor(props: {
    groupId: UUID;
    startDate?: Date;
    endDate?: Date;
    eventType?: CalendarEventType;
    search?: string;
  }) {
    this.#groupId = props.groupId;
    this.#startDate = props.startDate;
    this.#endDate = props.endDate;
    this.#eventType = props.eventType;
    this.#search = props.search;
  }

  get groupId(): UUID {
    return this.#groupId;
  }
  get startDate(): Date | undefined {
    return this.#startDate;
  }
  get endDate(): Date | undefined {
    return this.#endDate;
  }
  get eventType(): CalendarEventType | undefined {
    return this.#eventType;
  }
  get search(): string | undefined {
    return this.#search;
  }
}

/**
 * Сущность для обновления события
 */
export class CalendarEventPatchEntity {
  readonly #title?: string;
  readonly #description?: string;
  readonly #startDate?: Date;
  readonly #endDate?: Date;
  readonly #isAllDay?: boolean;

  constructor(props: { title?: string; description?: string; startDate?: Date; endDate?: Date; isAllDay?: boolean }) {
    this.#title = props.title;
    this.#description = props.description;
    this.#startDate = props.startDate;
    this.#endDate = props.endDate;
    this.#isAllDay = props.isAllDay;
  }

  get title(): string | undefined {
    return this.#title;
  }
  get description(): string | undefined {
    return this.#description;
  }
  get startDate(): Date | undefined {
    return this.#startDate;
  }
  get endDate(): Date | undefined {
    return this.#endDate;
  }
  get isAllDay(): boolean | undefined {
    return this.#isAllDay;
  }
}

/**
 * Сущность для удаления события
 */
export class CalendarEventDeleteEntity {
  readonly #id: UUID;
  readonly #deleteMode: 'single' | 'all';

  constructor(props: { id: UUID; deleteMode: 'single' | 'all' }) {
    this.#id = props.id;
    this.#deleteMode = props.deleteMode;
  }

  get id(): UUID {
    return this.#id;
  }
  get deleteMode(): 'single' | 'all' {
    return this.#deleteMode;
  }
}
