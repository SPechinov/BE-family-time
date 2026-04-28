import { IDeleteCalendarEventUseCase } from '@/domains/useCases';
import { CalendarEventFindOneEntity } from '@/entities';
import { CalendarEventsAccess } from './shared/access';
import { CalendarEventsUseCasesDeps } from './shared/types';

export class DeleteCalendarEventUseCase implements IDeleteCalendarEventUseCase {
  readonly #deps: CalendarEventsUseCasesDeps;
  readonly #access: CalendarEventsAccess;

  constructor(props: CalendarEventsUseCasesDeps) {
    this.#deps = props;
    this.#access = new CalendarEventsAccess({
      calendarEventsService: props.calendarEventsService,
      groupsUsersService: props.groupsUsersService,
    });
  }

  async execute(props: Parameters<IDeleteCalendarEventUseCase['execute']>[0]): Promise<void> {
    const options = { logger: props.logger };
    await this.#deps.usersService.findOneByUserIdOrThrow(props.userId, options);
    await this.#access.checkUserInGroupOrThrow(props.userId, props.groupId, options);

    const calendarEventFindOneEntity = new CalendarEventFindOneEntity({ id: props.calendarEventId, groupId: props.groupId });
    await this.#access.findOneCalendarEventOrThrow(calendarEventFindOneEntity, options);
    await this.#deps.calendarEventsService.deleteOne(calendarEventFindOneEntity, options);
  }
}
