import { Pool } from 'pg';
import { CalendarEventsUseCases } from '@/useCases';
import { createGroupsUsersService, createCalendarEventsService, createUsersService } from '../../utils';

export const createCalendarEventsDependencies = ({ postgres }: { postgres: Pool }) => {
  return {
    calendarEventsUseCases: new CalendarEventsUseCases({
      usersService: createUsersService({ postgres }),
      groupsUsersService: createGroupsUsersService({ postgres }),
      calendarEventsService: createCalendarEventsService({ postgres }),
    }),
  };
};
