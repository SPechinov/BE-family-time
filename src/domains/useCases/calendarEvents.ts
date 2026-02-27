import { UUID } from 'node:crypto';
import { CalendarEventEntity, CalendarEventCreateEntity, CalendarEventPatchOneEntity } from '@/entities';
import { DefaultProps } from './types';

export interface ICalendarEventsUseCases {
  createCalendarEvent(
    props: DefaultProps<{
      userId: UUID;
      groupId: UUID;
      calendarEventCreateEntity: CalendarEventCreateEntity;
    }>,
  ): Promise<CalendarEventEntity>;

  getCalendarEventsByGroupId(
    props: DefaultProps<{
      userId: UUID;
      groupId: UUID;
      startDate: Date;
      endDate: Date;
      eventType?: import('@/entities').CalendarEventType;
    }>,
  ): Promise<CalendarEventEntity[]>;

  getCalendarEventById(
    props: DefaultProps<{
      userId: UUID;
      eventId: UUID;
    }>,
  ): Promise<CalendarEventEntity>;

  updateCalendarEvent(
    props: DefaultProps<{
      userId: UUID;
      eventId: UUID;
      calendarEventPatchEntity: CalendarEventPatchOneEntity;
    }>,
  ): Promise<CalendarEventEntity>;

  deleteCalendarEvent(
    props: DefaultProps<{
      userId: UUID;
      eventId: UUID;
      deleteMode: 'single' | 'all';
    }>,
  ): Promise<void>;
}
