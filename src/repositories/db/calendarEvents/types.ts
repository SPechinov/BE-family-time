import {
  CalendarEventType,
  CalendarEventIterationType,
  CalendarEventRecurrencePattern,
  CalendarEventId,
  GroupId,
  UserId,
} from '@/entities';

export interface ICalendarEventRow {
  id: CalendarEventId;
  group_id: GroupId;
  creator_user_id: UserId;
  title: string;
  description: string | null;
  event_type: CalendarEventType;
  iteration_type: CalendarEventIterationType;
  start_date: Date;
  end_date: Date | null;
  recurrence_pattern: CalendarEventRecurrencePattern | null;
  created_at: Date;
}
