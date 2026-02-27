import {
  CalendarEventCreateEntity,
  CalendarEventEntity,
  CalendarEventFindManyEntity,
  CalendarEventFindOneEntity,
  CalendarEventPatchOneEntity,
} from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg';
import { ICalendarEventsService } from '@/domains/services';
import { ICalendarEventsRepository } from '@/domains/repositories/db';

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

  findOne(
    calendarEventFindOneEntity: CalendarEventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity | null> {
    return this.#calendarEventsRepository.findOne(calendarEventFindOneEntity, options);
  }

  findMany(
    entity: CalendarEventFindManyEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]> {
    return this.#calendarEventsRepository.findMany(entity, options);
  }

  patchOne(
    props: {
      calendarEventFindOneEntity: CalendarEventFindOneEntity;
      calendarEventPatchOneEntity: CalendarEventPatchOneEntity;
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
