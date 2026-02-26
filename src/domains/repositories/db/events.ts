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

export interface IEventsRepository {
  createOne(entity: EventCreateEntity, options?: { client?: PoolClient; logger?: ILogger }): Promise<EventEntity>;

  findOne(entity: EventFindOneEntity, options?: { client?: PoolClient; logger?: ILogger }): Promise<EventEntity | null>;

  findMany(filter: EventFindManyEntity, options?: { client?: PoolClient; logger?: ILogger }): Promise<EventEntity[]>;

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
      eventFindOneEntity: EventFindOneEntity;
      eventPatchOneEntity: EventPatchOneEntity;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity>;

  deleteOne(eventFindOneEntity: EventFindOneEntity, options?: { client?: PoolClient; logger?: ILogger }): Promise<void>;
}
