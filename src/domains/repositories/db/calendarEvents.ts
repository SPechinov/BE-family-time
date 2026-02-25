import {
  CalendarEventEntity,
  CalendarEventCreateEntity,
  CalendarEventFindOneEntity,
  CalendarEventFindManyEntity,
  CalendarEventPatchEntity,
} from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg/logger';
import { UUID } from 'node:crypto';

export interface ICalendarEventsRepository {
  createOne(
    entity: CalendarEventCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity>;

  findOne(
    entity: CalendarEventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity | null>;

  findByGroupId(
    groupId: UUID,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]>;

  findForPeriod(
    groupId: UUID,
    startDate: Date,
    endDate: Date,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]>;

  findExceptions(
    groupId: UUID,
    startDate: Date,
    endDate: Date,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]>;

  patchOne(
    id: UUID,
    patchData: CalendarEventPatchEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity>;

  deleteOne(
    id: UUID,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void>;

  deleteSeries(
    parentEventId: UUID,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void>;

  createException(
    entity: {
      parentEventId: UUID;
      exceptionDate: Date;
      title?: string;
      description?: string;
      startDate?: Date;
      endDate?: Date;
      isAllDay?: boolean;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity>;
}
