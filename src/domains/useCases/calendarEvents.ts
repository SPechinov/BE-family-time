import {
  CalendarEventEntity,
  CalendarEventCreateEntity,
  CalendarEventPatchOneEntity,
  GroupId,
  CalendarEventType,
  CalendarEventId,
  UserId,
} from '@/entities';
import { DefaultProps } from './types';

export interface ICalendarEventsUseCases {
  createCalendarEvent(
    props: DefaultProps<{
      userId: UserId;
      groupId: GroupId;
      calendarEventCreateEntity: CalendarEventCreateEntity;
    }>,
  ): Promise<CalendarEventEntity>;

  getCalendarEventsByGroupId(
    props: DefaultProps<{
      userId: UserId;
      groupId: GroupId;
      startDate: Date;
      endDate: Date;
      eventType?: CalendarEventType;
    }>,
  ): Promise<CalendarEventEntity[]>;

  getCalendarEvent(
    props: DefaultProps<{
      userId: UserId;
      groupId: GroupId;
      calendarEventId: CalendarEventId;
    }>,
  ): Promise<CalendarEventEntity>;

  patchCalendarEvent(
    props: DefaultProps<{
      userId: UserId;
      groupId: GroupId;
      calendarEventId: CalendarEventId;
      calendarEventPatchOneEntity: CalendarEventPatchOneEntity;
    }>,
  ): Promise<CalendarEventEntity>;

  deleteCalendarEvent(
    props: DefaultProps<{
      userId: UserId;
      groupId: GroupId;
      calendarEventId: CalendarEventId;
    }>,
  ): Promise<void>;
}
