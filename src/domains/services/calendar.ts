import {
  EventCreateEntity,
  EventEntity,
  EventFindOneEntity,
  EventPatchOneEntity,
  GroupId,
} from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg';

export interface ICalendarService {
  createOne(
    entity: EventCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity>;

  getEventsByGroupId(
    groupId: GroupId,
    startDate?: Date,
    endDate?: Date,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity[]>;

  findOne(
    calendarEventFindOneEntity: EventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity | null>;

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
