import {
  CalendarEventCreateEntity,
  CalendarEventEntity,
  CalendarEventFindOneEntity,
  CalendarEventPatchEntity,
  GroupId,
} from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg';

export interface ICalendarEventsService {
  createOne(
    entity: CalendarEventCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity>;

  getCalendarEventsByGroupId(
    groupId: GroupId,
    startDate?: Date,
    endDate?: Date,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]>;

  findOne(
    calendarEventFindOneEntity: CalendarEventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity | null>;

  patchOne(
    props: {
      calendarEventFindOneEntity: CalendarEventFindOneEntity;
      calendarEventPatchOneEntity: CalendarEventPatchEntity;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity>;

  deleteOne(
    calendarEventFindOneEntity: CalendarEventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void>;
}
