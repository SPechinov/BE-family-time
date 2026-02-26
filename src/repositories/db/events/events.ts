import { Pool, PoolClient } from 'pg';
import { IEventsRepository } from '@/domains/repositories/db';
import {
  EventEntity,
  EventCreateEntity,
  EventFindOneEntity,
  EventPatchOneEntity,
  EventFindManyEntity,
} from '@/entities';
import { IEventRow } from './types';
import { UUID } from 'node:crypto';
import { ILogger } from '@/pkg/logger';

export class EventsRepository implements IEventsRepository {
  readonly #pool: Pool;

  constructor(pool: Pool) {
    this.#pool = pool;
  }

  async createOne(
    entity: EventCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity> {
    const client = options?.client ?? this.#pool;

    const query = `
      INSERT INTO events (
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

    options?.logger?.debug({ query, values }, 'Events repository: createOne');

    const result = await client.query<IEventRow>(query, values);

    const row = result.rows?.[0];
    if (!row) throw new Error('Event not created');

    return this.#buildEventEntity(row);
  }

  async findOne(
    entity: EventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity | null> {
    const client = options?.client ?? this.#pool;

    const query = `
      SELECT * FROM events
      WHERE id = $1
    `;

    const values = [entity.id];

    options?.logger?.debug({ query, values }, 'Events repository: findOne');

    const result = await client.query<IEventRow>(query, values);
    const row = result.rows?.[0];

    if (!row) {
      return null;
    }

    return this.#buildEventEntity(row);
  }

  async findMany(
    filter: EventFindManyEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity[]> {
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
      SELECT * FROM events
      ${whereClause}
      ORDER BY start_date ASC
    `;

    options?.logger?.debug({ query, values }, 'Events repository: findMany');

    const result = await client.query<IEventRow>(query, values);
    return result.rows.map((row) => this.#buildEventEntity(row));
  }

  async findByGroupId(groupId: UUID, options?: { client?: PoolClient; logger?: ILogger }): Promise<EventEntity[]> {
    const client = options?.client ?? this.#pool;

    const query = `
      SELECT * FROM events
      WHERE group_id = $1
      ORDER BY start_date ASC
    `;

    const values = [groupId];

    options?.logger?.debug({ query, values }, 'Events repository: findByGroupId');

    const result = await client.query<IEventRow>(query, values);
    return result.rows.map((row) => this.#buildEventEntity(row));
  }

  async findForPeriod(
    groupId: UUID,
    period: {
      startDate?: Date;
      endDate?: Date;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity[]> {
    const client = options?.client ?? this.#pool;

    const query = `
      SELECT * FROM events
      WHERE group_id = $1
        AND (
          (iteration_type = 'oneTime' AND start_date <= $3 AND (end_date IS NULL OR end_date >= $2))
          OR (iteration_type IN ('weekly', 'monthly', 'yearly'))
        )
      ORDER BY start_date ASC
    `;

    const values = [groupId, period.startDate ?? null, period.endDate ?? null];

    options?.logger?.debug({ query, values }, 'Events repository: findForPeriod');

    const result = await client.query<IEventRow>(query, values);
    return result.rows.map((row) => this.#buildEventEntity(row));
  }

  async patchOne(
    props: {
      eventFindOneEntity: EventFindOneEntity;
      eventPatchOneEntity: EventPatchOneEntity;
    },
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<EventEntity> {
    const client = options?.client ?? this.#pool;

    const findOneEntity = props.eventFindOneEntity;
    const patchOneEntity = props.eventPatchOneEntity;

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
      UPDATE events
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    options?.logger?.debug({ query, values }, 'Events repository: patchOne');

    const result = await client.query<IEventRow>(query, values);
    const row = result.rows?.[0];

    if (!row) {
      throw new Error('Event not found');
    }

    return this.#buildEventEntity(row);
  }

  async deleteOne(
    eventFindOneEntity: EventFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void> {
    const client = options?.client ?? this.#pool;

    const query = `DELETE FROM events WHERE id = $1`;
    const values = [eventFindOneEntity.id];

    options?.logger?.debug({ query, values }, 'Events repository: deleteOne');

    const result = await client.query(query, values);

    if (result.rowCount === 0) {
      throw new Error('Event not found');
    }
  }

  #buildEventEntity(row: IEventRow): EventEntity {
    return new EventEntity({
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
