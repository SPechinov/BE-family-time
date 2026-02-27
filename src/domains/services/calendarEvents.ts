import {
  CalendarEventCreateEntity,
  CalendarEventEntity,
  CalendarEventFindOneEntity,
  CalendarEventPatchOneEntity,
  GroupId,
} from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg';

export interface ICalendarEventsService {
  createOne(
    entity: CalendarEventCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity>;

  getEventsByGroupId(
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
      calendarEventPatchOneEntity: CalendarEventPatchOneEntity;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity>;

  deleteOne(
    calendarEventFindOneEntity: CalendarEventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void>;
}
