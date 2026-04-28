import { FastifyInstance } from 'fastify';
import { CalendarEventsRoutesController } from '@/api/rest/routes/calendarEvents';
import {
  CreateCalendarEventUseCase,
  DeleteCalendarEventUseCase,
  GetCalendarEventUseCase,
  ListCalendarEventsUseCase,
  PatchCalendarEventUseCase,
} from '@/useCases';
import { ICalendarEventsService, IGroupsUsersService, IUsersService } from '@/domains/services';

type CalendarEventsRouteDeps = {
  instance: FastifyInstance;
  usersService: IUsersService;
  groupsUsersService: IGroupsUsersService;
  calendarEventsService: ICalendarEventsService;
};

const buildCalendarEventsUseCases = (props: Omit<CalendarEventsRouteDeps, 'instance'>) => {
  const deps = {
    usersService: props.usersService,
    groupsUsersService: props.groupsUsersService,
    calendarEventsService: props.calendarEventsService,
  };

  return {
    listCalendarEventsUseCase: new ListCalendarEventsUseCase(deps),
    getCalendarEventUseCase: new GetCalendarEventUseCase(deps),
    createCalendarEventUseCase: new CreateCalendarEventUseCase(deps),
    patchCalendarEventUseCase: new PatchCalendarEventUseCase(deps),
    deleteCalendarEventUseCase: new DeleteCalendarEventUseCase(deps),
  };
};

export const registerCalendarEventsRoutes = (props: CalendarEventsRouteDeps) => {
  const useCases = buildCalendarEventsUseCases({
    usersService: props.usersService,
    groupsUsersService: props.groupsUsersService,
    calendarEventsService: props.calendarEventsService,
  });

  new CalendarEventsRoutesController({
    fastify: props.instance,
    ...useCases,
  }).register();
};
