import { ICalendarRepository } from '@/domains/repositories/db';
import {
  CalendarEventCreateEntity,
  CalendarEventEntity,
  CalendarEventFindOneEntity,
  CalendarEventPatchOneEntity,
  GroupId,
} from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg';
import { ICalendarService } from '@/domains/services';

export class CalendarService implements ICalendarService {
  readonly #calendarRepository: ICalendarRepository;

  constructor(props: { calendarRepository: ICalendarRepository }) {
    this.#calendarRepository = props.calendarRepository;
  }

  createOne(
    entity: CalendarEventCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity> {
    return this.#calendarRepository.createOne(entity, options);
  }

  getEventsByGroupId(
    groupId: GroupId,
    startDate?: Date,
    endDate?: Date,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]> {
    return this.#calendarRepository.findForPeriod(groupId, { startDate, endDate }, options);
  }

  findOne(
    calendarEventFindOneEntity: CalendarEventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity | null> {
    return this.#calendarRepository.findOne(calendarEventFindOneEntity, options);
  }

  patchOne(
    props: {
      calendarEventFindOneEntity: CalendarEventFindOneEntity;
      calendarEventPatchOneEntity: CalendarEventPatchOneEntity;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity> {
    return this.#calendarRepository.patchOne(props, options);
  }

  deleteOne(
    calendarEventFindOneEntity: CalendarEventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void> {
    return this.#calendarRepository.deleteOne(calendarEventFindOneEntity, options);
  }
}
