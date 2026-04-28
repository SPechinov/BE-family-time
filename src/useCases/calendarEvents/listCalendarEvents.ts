import { IListCalendarEventsUseCase } from '@/domains/useCases';
import { CalendarEventEntity, CalendarEventFindManyEntity } from '@/entities';
import { CalendarEventsAccess } from './shared/access';
import { CalendarEventsUseCasesDeps } from './shared/types';

export class ListCalendarEventsUseCase implements IListCalendarEventsUseCase {
  readonly #deps: CalendarEventsUseCasesDeps;
  readonly #access: CalendarEventsAccess;

  constructor(props: CalendarEventsUseCasesDeps) {
    this.#deps = props;
    this.#access = new CalendarEventsAccess({
      calendarEventsService: props.calendarEventsService,
      groupsUsersService: props.groupsUsersService,
    });
  }

  async execute(props: Parameters<IListCalendarEventsUseCase['execute']>[0]): Promise<CalendarEventEntity[]> {
    const options = { logger: props.logger };
    await this.#deps.usersService.findOneByUserIdOrThrow(props.userId, options);
    await this.#access.checkUserInGroupOrThrow(props.userId, props.groupId, options);

    const period =
      props.startDate === undefined && props.endDate === undefined
        ? undefined
        : { startDate: props.startDate, endDate: props.endDate };

    return this.#deps.calendarEventsService.findMany(
      new CalendarEventFindManyEntity({
        groupId: props.groupId,
        eventType: props.eventType,
        period,
      }),
      options,
    );
  }
}
