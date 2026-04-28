import { ICreateCalendarEventUseCase } from '@/domains/useCases';
import { CalendarEventEntity } from '@/entities';
import { CalendarEventsAccess } from './shared/access';
import { CalendarEventsUseCasesDeps } from './shared/types';
import { validateDateRangeOrThrow, validateRecurrencePatternOrThrow } from './shared/validation';

export class CreateCalendarEventUseCase implements ICreateCalendarEventUseCase {
  readonly #deps: CalendarEventsUseCasesDeps;
  readonly #access: CalendarEventsAccess;

  constructor(props: CalendarEventsUseCasesDeps) {
    this.#deps = props;
    this.#access = new CalendarEventsAccess({
      calendarEventsService: props.calendarEventsService,
      groupsUsersService: props.groupsUsersService,
    });
  }

  async execute(props: Parameters<ICreateCalendarEventUseCase['execute']>[0]): Promise<CalendarEventEntity> {
    validateRecurrencePatternOrThrow(
      props.calendarEventCreateEntity.iterationType,
      props.calendarEventCreateEntity.recurrencePattern,
      props.logger,
    );
    validateDateRangeOrThrow(props.calendarEventCreateEntity.startDate, props.calendarEventCreateEntity.endDate);

    const options = { logger: props.logger };
    await this.#deps.usersService.findOneByUserIdOrThrow(props.userId, options);
    await this.#access.checkUserInGroupOrThrow(props.userId, props.groupId, options);

    return this.#deps.calendarEventsService.createOne(props.calendarEventCreateEntity, options);
  }
}
