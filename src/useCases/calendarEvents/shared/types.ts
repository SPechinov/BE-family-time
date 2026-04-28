import { ICalendarEventsService, IGroupsUsersService, IUsersService } from '@/domains/services';
import { ILogger } from '@/pkg';

export interface CalendarEventsUseCasesDeps {
  usersService: IUsersService;
  groupsUsersService: IGroupsUsersService;
  calendarEventsService: ICalendarEventsService;
}

export type CalendarEventsOptions = { logger: ILogger };
