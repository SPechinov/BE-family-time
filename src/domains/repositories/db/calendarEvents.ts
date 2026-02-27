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

export interface ICalendarEventsRepository {
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
    period: {
      startDate?: Date;
      endDate?: Date;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]>;

  patchOne(
    props: {
      calendarEventFindOneEntity: CalendarEventFindOneEntity;
      calendarEventPatchOneEntity: CalendarEventPatchOneEntity;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity>;

  deleteOne(
    calendarEventFindOneEntity: CalendarEventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void>;
}
