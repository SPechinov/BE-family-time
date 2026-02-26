import { EventCreateEntity, EventEntity, EventFindOneEntity, EventPatchOneEntity, GroupId } from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg';

export interface IEventsService {
  createOne(entity: EventCreateEntity, options?: { client?: PoolClient; logger?: ILogger }): Promise<EventEntity>;

  getEventsByGroupId(
    groupId: GroupId,
    startDate?: Date,
    endDate?: Date,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity[]>;

  findOne(
    eventFindOneEntity: EventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity | null>;

  patchOne(
    props: {
      eventFindOneEntity: EventFindOneEntity;
      eventPatchOneEntity: EventPatchOneEntity;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity>;

  deleteOne(eventFindOneEntity: EventFindOneEntity, options?: { client?: PoolClient; logger?: ILogger }): Promise<void>;
}
