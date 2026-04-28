import { IPatchCalendarEventUseCase } from '@/domains/useCases';
import { CalendarEventEntity, CalendarEventFindOneEntity } from '@/entities';
import { CalendarEventsAccess } from './shared/access';
import { CalendarEventsUseCasesDeps } from './shared/types';
import { validateDateRangeOrThrow, validateRecurrencePatternOrThrow } from './shared/validation';

export class PatchCalendarEventUseCase implements IPatchCalendarEventUseCase {
  readonly #deps: CalendarEventsUseCasesDeps;
  readonly #access: CalendarEventsAccess;

  constructor(props: CalendarEventsUseCasesDeps) {
    this.#deps = props;
    this.#access = new CalendarEventsAccess({
      calendarEventsService: props.calendarEventsService,
      groupsUsersService: props.groupsUsersService,
    });
  }

  async execute(props: Parameters<IPatchCalendarEventUseCase['execute']>[0]): Promise<CalendarEventEntity> {
    if (props.calendarEventPatchOneEntity.iterationType) {
      validateRecurrencePatternOrThrow(
        props.calendarEventPatchOneEntity.iterationType,
        props.calendarEventPatchOneEntity.recurrencePattern,
        props.logger,
      );
    }

    if (props.calendarEventPatchOneEntity.startDate && props.calendarEventPatchOneEntity.endDate) {
      validateDateRangeOrThrow(props.calendarEventPatchOneEntity.startDate, props.calendarEventPatchOneEntity.endDate);
    }

    const options = { logger: props.logger };
    await this.#deps.usersService.findOneByUserIdOrThrow(props.userId, options);
    await this.#access.checkUserInGroupOrThrow(props.userId, props.groupId, options);

    const calendarEventFindOneEntity = new CalendarEventFindOneEntity({ id: props.calendarEventId, groupId: props.groupId });
    await this.#access.findOneCalendarEventOrThrow(calendarEventFindOneEntity, options);

    return this.#deps.calendarEventsService.patchOne(
      {
        calendarEventFindOneEntity,
        calendarEventPatchOneEntity: props.calendarEventPatchOneEntity,
      },
      options,
    );
  }
}
