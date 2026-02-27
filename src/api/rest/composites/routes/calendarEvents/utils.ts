import { Pool } from 'pg';
import { CalendarEventsUseCases } from '@/useCases';
import { createGroupsUsersService, createCalendarEventsService } from '../../utils';

export const createCalendarEventsDependencies = (props: { postgres: Pool }) => {
  return {
    calendarEventsUseCases: new CalendarEventsUseCases({
      groupsUsersService: createGroupsUsersService({ postgres: props.postgres }),
      calendarEventsService: createCalendarEventsService({ postgres: props.postgres }),
    }),
  };
};
