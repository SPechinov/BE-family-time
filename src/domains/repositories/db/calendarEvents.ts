import {
  EventEntity,
  EventCreateEntity,
  EventFindOneEntity,
  EventPatchOneEntity,
  EventFindManyEntity,
} from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg/logger';
import { UUID } from 'node:crypto';

export interface ICalendarRepository {
  createOne(
    entity: EventCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity>;

  findOne(
    entity: EventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity | null>;

  findMany(
    filter: EventFindManyEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity[]>;

  findByGroupId(groupId: UUID, options?: { client?: PoolClient; logger?: ILogger }): Promise<EventEntity[]>;

  findForPeriod(
    groupId: UUID,
    period: {
      startDate?: Date;
      endDate?: Date;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity[]>;

  patchOne(
    props: {
      calendarEventFindOneEntity: EventFindOneEntity;
      calendarEventPatchOneEntity: EventPatchOneEntity;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity>;

  deleteOne(
    calendarEventFindOneEntity: EventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void>;
}
