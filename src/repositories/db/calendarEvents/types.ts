import { UUID } from 'node:crypto';
import { CalendarEventType, RecurrencePattern } from '@/entities';

/**
 * Тип строки таблицы calendar_events
 */
export interface ICalendarEventRow {
  id: UUID;
  group_id: UUID;
  creator_user_id: UUID;
  title: string;
  description: string | null;
  event_type: CalendarEventType;
  start_date: Date;
  end_date: Date;
  is_all_day: boolean;
  recurrence_pattern: RecurrencePattern | null;
  parent_event_id: UUID | null;
  is_exception: boolean;
  exception_date: Date | null;
  created_at: Date;
  updated_at: Date;
}
