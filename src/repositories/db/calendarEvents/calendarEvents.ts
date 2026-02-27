import { Pool, PoolClient } from 'pg';
import { ICalendarEventsRepository } from '@/domains/repositories/db';
import {
  CalendarEventEntity,
  CalendarEventCreateEntity,
  CalendarEventFindOneEntity,
  CalendarEventPatchOneEntity,
  CalendarEventFindManyEntity,
} from '@/entities';
import { ICalendarEventRow } from './types';
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
        iteration_type, start_date, end_date, recurrence_pattern
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      entity.groupId,
      entity.creatorUserId,
      entity.title,
      entity.description ?? null,
      entity.eventType,
      entity.iterationType,
      entity.startDate,
      entity.endDate,
      entity.recurrencePattern ? JSON.stringify(entity.recurrencePattern) : null,
    ];

    options?.logger?.debug({ query, values }, 'CalendarEvents repository: createOne');

    const result = await client.query<ICalendarEventRow>(query, values);

    const row = result.rows?.[0];
    if (!row) throw new Error('Calendar event not created');

    return this.#buildCalendarEventEntity(row);
  }

  async findOne(
    entity: CalendarEventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity | null> {
    const client = options?.client ?? this.#pool;

    const hasGroupId = entity.groupId !== undefined;

    const query = `
      SELECT * FROM calendar_events
      WHERE id = $1
      ${hasGroupId ? 'AND group_id = $2' : ''}
    `;

    const values: any[] = [entity.id];
    if (hasGroupId) {
      values.push(entity.groupId);
    }

    options?.logger?.debug({ query, values }, 'CalendarEvents repository: findOne');

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
    if (filter.period !== undefined) {
      const startDate = filter.period.startDate ?? null;
      const endDate = filter.period.endDate ?? null;
      conditions.push(`
        (
          (iteration_type = 'oneTime' AND start_date <= $${paramIndex++} AND (end_date IS NULL OR end_date >= $${paramIndex++}))
          OR (iteration_type IN ('weekly', 'monthly', 'yearly'))
        )
      `);
      values.push(endDate, startDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT * FROM calendar_events
                      ${whereClause}
      ORDER BY start_date ASC
    `;

    options?.logger?.debug({ query, values }, 'CalendarEvents repository: findMany');

    const result = await client.query<ICalendarEventRow>(query, values);
    return result.rows.map((row) => this.#buildCalendarEventEntity(row));
  }

  async patchOne(
    props: {
      calendarEventFindOneEntity: CalendarEventFindOneEntity;
      calendarEventPatchOneEntity: CalendarEventPatchOneEntity;
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
    if (patchOneEntity.iterationType !== undefined) {
      updates.push(`iteration_type = $${paramIndex++}`);
      values.push(patchOneEntity.iterationType);
    }
    if (patchOneEntity.startDate !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(patchOneEntity.startDate);
    }
    if (patchOneEntity.endDate !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      values.push(patchOneEntity.endDate);
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
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    options?.logger?.debug({ query, values }, 'CalendarEvents repository: patchOne');

    const result = await client.query<ICalendarEventRow>(query, values);
    const row = result.rows?.[0];

    if (!row) {
      throw new Error('Calendar event not found');
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

    options?.logger?.debug({ query, values }, 'CalendarEvents repository: deleteOne');

    const result = await client.query(query, values);

    if (result.rowCount === 0) {
      throw new Error('Calendar event not found');
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
      iterationType: row.iteration_type,
      startDate: row.start_date,
      endDate: row.end_date ?? undefined,
      recurrencePattern: row.recurrence_pattern ?? undefined,
      createdAt: row.created_at,
    });
  }
}
