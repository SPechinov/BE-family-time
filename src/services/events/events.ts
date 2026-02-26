import { IEventsRepository } from '@/domains/repositories/db';
import { EventCreateEntity, EventEntity, EventFindOneEntity, EventPatchOneEntity, GroupId } from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg';
import { IEventsService } from '@/domains/services';

export class EventsService implements IEventsService {
  readonly #eventsRepository: IEventsRepository;

  constructor(props: { eventsRepository: IEventsRepository }) {
    this.#eventsRepository = props.eventsRepository;
  }

  createOne(entity: EventCreateEntity, options?: { client?: PoolClient; logger?: ILogger }): Promise<EventEntity> {
    return this.#eventsRepository.createOne(entity, options);
  }

  getEventsByGroupId(
    groupId: GroupId,
    startDate?: Date,
    endDate?: Date,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity[]> {
    return this.#eventsRepository.findForPeriod(groupId, { startDate, endDate }, options);
  }

  findOne(
    eventFindOneEntity: EventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity | null> {
    return this.#eventsRepository.findOne(eventFindOneEntity, options);
  }

  patchOne(
    props: {
      eventFindOneEntity: EventFindOneEntity;
      eventPatchOneEntity: EventPatchOneEntity;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity> {
    return this.#eventsRepository.patchOne(props, options);
  }

  deleteOne(
    eventFindOneEntity: EventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void> {
    return this.#eventsRepository.deleteOne(eventFindOneEntity, options);
  }
}
