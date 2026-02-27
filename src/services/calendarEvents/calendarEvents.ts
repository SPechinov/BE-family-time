import { ICalendarEventsRepository } from '@/domains/repositories/db';
import {
  CalendarEventCreateEntity,
  CalendarEventEntity,
  CalendarEventFindOneEntity,
  CalendarEventPatchEntity,
  GroupId,
} from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg';
import { ICalendarEventsService } from '@/domains/services';

export class CalendarEventsService implements ICalendarEventsService {
  readonly #calendarEventsRepository: ICalendarEventsRepository;

  constructor(props: { calendarEventsRepository: ICalendarEventsRepository }) {
    this.#calendarEventsRepository = props.calendarEventsRepository;
  }

  createOne(
    entity: CalendarEventCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity> {
    return this.#calendarEventsRepository.createOne(entity, options);
  }

  getCalendarEventsByGroupId(
    groupId: GroupId,
    startDate?: Date,
    endDate?: Date,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]> {
    return this.#calendarEventsRepository.findForPeriod(groupId, { startDate, endDate }, options);
  }

  findOne(
    calendarEventFindOneEntity: CalendarEventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity | null> {
    return this.#calendarEventsRepository.findOne(calendarEventFindOneEntity, options);
  }

  patchOne(
    props: {
      calendarEventFindOneEntity: CalendarEventFindOneEntity;
      calendarEventPatchOneEntity: CalendarEventPatchEntity;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity> {
    return this.#calendarEventsRepository.patchOne(props, options);
  }

  deleteOne(
    calendarEventFindOneEntity: CalendarEventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void> {
    return this.#calendarEventsRepository.deleteOne(calendarEventFindOneEntity, options);
  }
}
