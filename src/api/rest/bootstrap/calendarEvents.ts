import { FastifyInstance } from 'fastify';
import { CalendarEventsRoutesController } from '@/api/rest/routes/calendarEvents';
import { CalendarEventsUseCases } from '@/useCases';
import { ICalendarEventsService, IGroupsUsersService, IUsersService } from '@/domains/services';

export const registerCalendarEventsRoutes = (props: {
  instance: FastifyInstance;
  usersService: IUsersService;
  groupsUsersService: IGroupsUsersService;
  calendarEventsService: ICalendarEventsService;
}) => {
  const calendarEventsUseCases = new CalendarEventsUseCases({
    usersService: props.usersService,
    groupsUsersService: props.groupsUsersService,
    calendarEventsService: props.calendarEventsService,
  });

  new CalendarEventsRoutesController({
    fastify: props.instance,
    calendarEventsUseCases,
  }).register();
};
