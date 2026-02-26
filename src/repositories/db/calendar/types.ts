import { UUID } from 'node:crypto';
import { CalendarEventType, CalendarEventIterationType, CalendarEventRecurrencePattern } from '@/entities';

export interface ICalendarEventRow {
  id: UUID;
  group_id: UUID;
  creator_user_id: UUID;
  title: string;
  description: string | null;
  event_type: CalendarEventType;
  iteration_type: CalendarEventIterationType;
  start_date: Date;
  end_date: Date | null;
  recurrence_pattern: CalendarEventRecurrencePattern | null;
  created_at: Date;
}
