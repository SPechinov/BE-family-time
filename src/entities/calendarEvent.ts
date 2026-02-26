import { UUID } from 'node:crypto';
import { UserId } from './user';
import { GroupId } from './group';

export type CalendarEventId = UUID;
export type CalendarEventType = 'birthday' | 'vacation' | 'monthly' | 'holiday';
export type CalendarEventIterationType = 'oneTime' | 'weekly' | 'monthly' | 'yearly';

export type CalendarEventRecurrencePattern =
  | { type: 'weekly'; dayOfWeek: number }
  | { type: 'monthly'; dayOfMonth: number };

export class CalendarEventEntity {
  readonly #id: CalendarEventId;
  readonly #groupId: GroupId;
  readonly #creatorUserId: UserId;
  readonly #title: string;
  readonly #description?: string;
  readonly #eventType: CalendarEventType;
  readonly #iterationType: CalendarEventIterationType;
  readonly #startDate: Date;
  readonly #endDate?: Date;
  readonly #createdAt: Date;
}
