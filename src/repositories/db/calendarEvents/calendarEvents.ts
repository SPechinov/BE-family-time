import { Pool, PoolClient } from 'pg';
import { ICalendarEventsRepository } from '@/domains/repositories/db';
import {
  CalendarEventEntity,
  CalendarEventCreateEntity,
  CalendarEventFindOneEntity,
  CalendarEventPatchEntity,
  CalendarEventFindManyEntity,
} from '@/entities';
import { ICalendarEventRow } from './types';
import { UUID } from 'node:crypto';
import { ILogger } from '@/pkg/logger';

export class CalendarEventsRepository implements ICalendarEventsRepository {
  readonly #pool: Pool;

  constructor(pool: Pool) {
    this.#pool = pool;
  }

  async createOne(
    entity: CalendarEventCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity> {
    const client = options?.client ?? this.#pool;

    const query = `
      INSERT INTO calendar_events (
        group_id, creator_user_id, title, description, event_type,
        start_date, end_date, is_all_day, recurrence_pattern,
        is_exception, exception_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, NULL)
      RETURNING *
    `;

    const values = [
      entity.groupId,
      entity.creatorUserId,
      entity.title,
      entity.description ?? null,
      entity.eventType,
      entity.startDate,
      entity.endDate,
      entity.isAllDay,
      entity.recurrencePattern ? JSON.stringify(entity.recurrencePattern) : null,
    ];

    options?.logger?.debug({ query, values }, 'CalendarEvent repository: createOne');

    const result = await client.query<ICalendarEventRow>(query, values);

    const row = result.rows?.[0];
    if (!row) throw new Error('Event not created');

    return this.#buildCalendarEventEntity(row);
  }

  async findOne(
    entity: CalendarEventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity | null> {
    const client = options?.client ?? this.#pool;

    const query = `
      SELECT * FROM calendar_events
      WHERE id = $1
    `;

    const values = [entity.id];

    options?.logger?.debug({ query, values }, 'CalendarEvent repository: findOne');

    const result = await client.query<ICalendarEventRow>(query, values);
    const row = result.rows?.[0];

    if (!row) {
      return null;
    }

    return this.#buildCalendarEventEntity(row);
  }

  async findMany(
    filter: CalendarEventFindManyEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]> {
    const client = options?.client ?? this.#pool;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filter.ids !== undefined) {
      conditions.push(`id = ANY($${paramIndex++})`);
      values.push(filter.ids);
    }
    if (filter.groupId !== undefined) {
      conditions.push(`group_id = $${paramIndex++}`);
      values.push(filter.groupId);
    }
    if (filter.creatorUserId !== undefined) {
      conditions.push(`creator_user_id = $${paramIndex++}`);
      values.push(filter.creatorUserId);
    }
    if (filter.eventType !== undefined) {
      conditions.push(`event_type = $${paramIndex++}`);
      values.push(filter.eventType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT * FROM calendar_events
      ${whereClause}
      ORDER BY start_date ASC
    `;

    options?.logger?.debug({ query, values }, 'CalendarEvent repository: findMany');

    const result = await client.query<ICalendarEventRow>(query, values);
    return result.rows.map((row) => this.#buildCalendarEventEntity(row));
  }

  async findByGroupId(
    groupId: UUID,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]> {
    const client = options?.client ?? this.#pool;

    const query = `
      SELECT * FROM calendar_events
      WHERE group_id = $1
      ORDER BY start_date ASC
    `;

    const values = [groupId];

    options?.logger?.debug({ query, values }, 'CalendarEvent repository: findByGroupId');

    const result = await client.query<ICalendarEventRow>(query, values);
    return result.rows.map((row) => this.#buildCalendarEventEntity(row));
  }

  async findForPeriod(
    groupId: UUID,
    period: {
      startDate?: Date;
      endDate?: Date;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]> {
    const client = options?.client ?? this.#pool;

    const query = `
      SELECT * FROM calendar_events
      WHERE group_id = $1
        AND (
          (event_type = 'one-time' AND start_date <= $3 AND (end_date IS NULL OR end_date >= $2))
          OR (event_type IN ('weekly', 'monthly', 'yearly', 'work-schedule'))
        )
      ORDER BY start_date ASC
    `;

    const values = [groupId, period.startDate ?? null, period.endDate ?? null];

    options?.logger?.debug({ query, values }, 'CalendarEvent repository: findForPeriod');

    const result = await client.query<ICalendarEventRow>(query, values);
    return result.rows.map((row) => this.#buildCalendarEventEntity(row));
  }

  async patchOne(
    props: {
      calendarEventFindOneEntity: CalendarEventFindOneEntity;
      calendarEventPatchOneEntity: CalendarEventPatchEntity;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity> {
    const client = options?.client ?? this.#pool;

    const findOneEntity = props.calendarEventFindOneEntity;
    const patchOneEntity = props.calendarEventPatchOneEntity;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (patchOneEntity.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(patchOneEntity.title);
    }
    if (patchOneEntity.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(patchOneEntity.description);
    }
    if (patchOneEntity.eventType !== undefined) {
      updates.push(`event_type = $${paramIndex++}`);
      values.push(patchOneEntity.eventType);
    }
    if (patchOneEntity.startDate !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(patchOneEntity.startDate);
    }
    if (patchOneEntity.endDate !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      values.push(patchOneEntity.endDate);
    }
    if (patchOneEntity.isAllDay !== undefined) {
      updates.push(`is_all_day = $${paramIndex++}`);
      values.push(patchOneEntity.isAllDay);
    }
    if (patchOneEntity.recurrencePattern !== undefined) {
      updates.push(`recurrence_pattern = $${paramIndex++}`);
      values.push(patchOneEntity.recurrencePattern ? JSON.stringify(patchOneEntity.recurrencePattern) : null);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(findOneEntity.id);

    const query = `
      UPDATE calendar_events
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    options?.logger?.debug({ query, values }, 'CalendarEvent repository: patchOne');

    const result = await client.query<ICalendarEventRow>(query, values);
    const row = result.rows?.[0];

    if (!row) {
      throw new Error('Event not found');
    }

    return this.#buildCalendarEventEntity(row);
  }

  async deleteOne(
    calendarEventFindOneEntity: CalendarEventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void> {
    const client = options?.client ?? this.#pool;

    const query = `DELETE FROM calendar_events WHERE id = $1`;
    const values = [calendarEventFindOneEntity.id];

    options?.logger?.debug({ query, values }, 'CalendarEvent repository: deleteOne');

    const result = await client.query(query, values);

    if (result.rowCount === 0) {
      throw new Error('Event not found');
    }
  }

  #buildCalendarEventEntity(row: ICalendarEventRow): CalendarEventEntity {
    return new CalendarEventEntity({
      id: row.id,
      groupId: row.group_id,
      creatorUserId: row.creator_user_id,
      title: row.title,
      description: row.description ?? undefined,
      eventType: row.event_type,
      startDate: row.start_date,
      endDate: row.end_date,
      isAllDay: row.is_all_day,
      recurrencePattern: row.recurrence_pattern ?? undefined,
      parentEventId: row.parent_event_id ?? undefined,
      isException: row.is_exception,
      exceptionDate: row.exception_date ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
