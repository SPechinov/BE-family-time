import { CalendarEventsService } from '@/services';
import { CalendarEventsRepository } from '@/repositories/db';
import { Pool } from 'pg';

export const createCalendarEventsService = (props: { postgres: Pool }) => {
  return new CalendarEventsService({ calendarEventsRepository: new CalendarEventsRepository(props.postgres) });
};
