import { ICalendarRepository } from '@/domains/repositories/db';
import {
  EventCreateEntity,
  EventEntity,
  EventFindOneEntity,
  EventPatchOneEntity,
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
    entity: EventCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity> {
    return this.#calendarRepository.createOne(entity, options);
  }

  getEventsByGroupId(
    groupId: GroupId,
    startDate?: Date,
    endDate?: Date,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity[]> {
    return this.#calendarRepository.findForPeriod(groupId, { startDate, endDate }, options);
  }

  findOne(
    calendarEventFindOneEntity: EventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity | null> {
    return this.#calendarRepository.findOne(calendarEventFindOneEntity, options);
  }

  patchOne(
    props: {
      calendarEventFindOneEntity: EventFindOneEntity;
      calendarEventPatchOneEntity: EventPatchOneEntity;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity> {
    return this.#calendarRepository.patchOne(props, options);
  }

  deleteOne(
    calendarEventFindOneEntity: EventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void> {
    return this.#calendarRepository.deleteOne(calendarEventFindOneEntity, options);
  }
}
