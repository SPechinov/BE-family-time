import {
  CalendarEventEntity,
  CalendarEventCreateEntity,
  CalendarEventFindOneEntity,
  CalendarEventPatchOneEntity,
  CalendarEventFindManyEntity,
} from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg/logger';
import { UUID } from 'node:crypto';

export interface ICalendarRepository {
  createOne(
    entity: CalendarEventCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity>;

  findOne(
    entity: CalendarEventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity | null>;

  findMany(
    filter: CalendarEventFindManyEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]>;

  findByGroupId(groupId: UUID, options?: { client?: PoolClient; logger?: ILogger }): Promise<CalendarEventEntity[]>;

  findForPeriod(
    groupId: UUID,
    startDate: Date,
    endDate: Date,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]>;

  patchOne(
    id: UUID,
    patchData: CalendarEventPatchOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity>;

  deleteOne(id: UUID, options?: { client?: PoolClient; logger?: ILogger }): Promise<void>;
}
