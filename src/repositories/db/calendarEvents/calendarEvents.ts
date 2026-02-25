import { Pool, PoolClient } from 'pg';
import { ICalendarEventsRepository } from '@/domains/repositories/db';
import {
  CalendarEventEntity,
  CalendarEventCreateEntity,
  CalendarEventFindOneEntity,
  CalendarEventPatchEntity,
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
        start_date, end_date, is_all_day, recurrence_pattern
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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

    const query = `
      SELECT * FROM calendar_events
      WHERE id = $1
    `;

    const values = [entity.id];

    options?.logger?.debug({ query, values }, 'CalendarEvents repository: findOne');

    const result = await client.query<ICalendarEventRow>(query, values);
    const row = result.rows?.[0];

    if (!row) {
      return null;
    }

    return this.#buildCalendarEventEntity(row);
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

    options?.logger?.debug({ query, values }, 'CalendarEvents repository: findByGroupId');

    const result = await client.query<ICalendarEventRow>(query, values);
    return result.rows.map((row) => this.#buildCalendarEventEntity(row));
  }

  async findForPeriod(
    groupId: UUID,
    startDate: Date,
    endDate: Date,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]> {
    const client = options?.client ?? this.#pool;

    // Получаем все события группы, которые могут пересекаться с периодом
    // Для recurring событий получаем базовые события (без исключений)
    const query = `
      SELECT * FROM calendar_events
      WHERE group_id = $1
        AND (
          -- One-time и yearly события в периоде
          (event_type IN ('one-time', 'yearly') AND start_date <= $3 AND end_date >= $2)
          -- Recurring события (weekly, monthly, work-schedule)
          OR (event_type IN ('weekly', 'monthly', 'work-schedule'))
        )
      ORDER BY start_date ASC
    `;

    const values = [groupId, startDate, endDate];

    options?.logger?.debug({ query, values }, 'CalendarEvents repository: findForPeriod');

    const result = await client.query<ICalendarEventRow>(query, values);
    return result.rows.map((row) => this.#buildCalendarEventEntity(row));
  }

  async findExceptions(
    groupId: UUID,
    startDate: Date,
    endDate: Date,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]> {
    const client = options?.client ?? this.#pool;

    const query = `
      SELECT * FROM calendar_events
      WHERE group_id = $1
        AND is_exception = true
        AND exception_date >= $2
        AND exception_date <= $3
      ORDER BY exception_date ASC
    `;

    const values = [groupId, startDate, endDate];

    options?.logger?.debug({ query, values }, 'CalendarEvents repository: findExceptions');

    const result = await client.query<ICalendarEventRow>(query, values);
    return result.rows.map((row) => this.#buildCalendarEventEntity(row));
  }

  async patchOne(
    id: UUID,
    patchData: CalendarEventPatchEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity> {
    const client = options?.client ?? this.#pool;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (patchData.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(patchData.title);
    }
    if (patchData.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(patchData.description);
    }
    if (patchData.startDate !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(patchData.startDate);
    }
    if (patchData.endDate !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      values.push(patchData.endDate);
    }
    if (patchData.isAllDay !== undefined) {
      updates.push(`is_all_day = $${paramIndex++}`);
      values.push(patchData.isAllDay);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

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

  async deleteOne(id: UUID, options?: { client?: PoolClient; logger?: ILogger }): Promise<void> {
    const client = options?.client ?? this.#pool;

    const query = `DELETE FROM calendar_events WHERE id = $1`;
    const values = [id];

    options?.logger?.debug({ query, values }, 'CalendarEvents repository: deleteOne');

    const result = await client.query(query, values);

    if (result.rowCount === 0) {
      throw new Error('Calendar event not found');
    }
  }

  async deleteSeries(parentEventId: UUID, options?: { client?: PoolClient; logger?: ILogger }): Promise<void> {
    const client = options?.client ?? this.#pool;

    // Удаляем все исключения и само родительское событие
    const query = `
      DELETE FROM calendar_events
      WHERE id = $1 OR parent_event_id = $1
    `;
    const values = [parentEventId];

    options?.logger?.debug({ query, values }, 'CalendarEvents repository: deleteSeries');

    const result = await client.query(query, values);

    if (result.rowCount === 0) {
      throw new Error('Calendar event series not found');
    }
  }

  async createException(
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
  ): Promise<CalendarEventEntity> {
    const client = options?.client ?? this.#pool;

    // Получаем родительское событие для копирования основных полей
    const parentResult = await client.query<ICalendarEventRow>('SELECT * FROM calendar_events WHERE id = $1', [
      entity.parentEventId,
    ]);

    const parent = parentResult.rows?.[0];
    if (!parent) {
      throw new Error('Parent event not found');
    }

    const query = `
      INSERT INTO calendar_events (
        group_id, creator_user_id, title, description, event_type,
        start_date, end_date, is_all_day, recurrence_pattern,
        parent_event_id, is_exception, exception_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11)
      RETURNING *
    `;

    const values = [
      parent.group_id,
      parent.creator_user_id,
      entity.title ?? parent.title,
      entity.description ?? parent.description,
      parent.event_type,
      entity.startDate ?? entity.exceptionDate,
      entity.endDate ?? entity.exceptionDate,
      entity.isAllDay ?? parent.is_all_day,
      null, // recurrence_pattern для исключения
      entity.parentEventId,
      entity.exceptionDate,
    ];

    options?.logger?.debug({ query, values }, 'CalendarEvents repository: createException');

    const result = await client.query<ICalendarEventRow>(query, values);
    const row = result.rows?.[0];

    if (!row) {
      throw new Error('Calendar event exception not created');
    }

    return this.#buildCalendarEventEntity(row);
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
