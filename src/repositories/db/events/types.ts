import { UUID } from 'node:crypto';
import { EventType, EventIterationType, EventRecurrencePattern } from '@/entities';

export interface IEventRow {
  id: UUID;
  group_id: UUID;
  creator_user_id: UUID;
  title: string;
  description: string | null;
  event_type: EventType;
  iteration_type: EventIterationType;
  start_date: Date;
  end_date: Date | null;
  recurrence_pattern: EventRecurrencePattern | null;
  created_at: Date;
}
