import { IGetCalendarEventUseCase } from '@/domains/useCases';
import { CalendarEventEntity, CalendarEventFindOneEntity } from '@/entities';
import { CalendarEventsAccess } from './shared/access';
import { CalendarEventsUseCasesDeps } from './shared/types';

export class GetCalendarEventUseCase implements IGetCalendarEventUseCase {
  readonly #deps: CalendarEventsUseCasesDeps;
  readonly #access: CalendarEventsAccess;

  constructor(props: CalendarEventsUseCasesDeps) {
    this.#deps = props;
    this.#access = new CalendarEventsAccess({
      calendarEventsService: props.calendarEventsService,
      groupsUsersService: props.groupsUsersService,
    });
  }

  async execute(props: Parameters<IGetCalendarEventUseCase['execute']>[0]): Promise<CalendarEventEntity> {
    const options = { logger: props.logger };
    await this.#deps.usersService.findOneByUserIdOrThrow(props.userId, options);
    await this.#access.checkUserInGroupOrThrow(props.userId, props.groupId, options);

    return this.#access.findOneCalendarEventOrThrow(
      new CalendarEventFindOneEntity({ id: props.calendarEventId, groupId: props.groupId }),
      options,
    );
  }
}
