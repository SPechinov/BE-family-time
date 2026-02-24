import { Pool, PoolClient } from 'pg';
import { IGroupsRepository } from '@/domains/repositories/db';
import {
  GroupCreateEntity,
  GroupFindManyEntity,
  GroupEntity,
  GroupFindOneEntity,
  GroupPatchOneEntity,
} from '@/entities';
import { IGroupRowData } from './types';
import { UUID } from 'node:crypto';
import { ILogger } from '@/pkg/logger';

export class GroupsRepository implements IGroupsRepository {
  readonly #pool: Pool;

  constructor(pool: Pool) {
    this.#pool = pool;
  }

  async createOne(
    groupCreateEntity: GroupCreateEntity,
    options: { client?: PoolClient; logger: ILogger },
  ): Promise<GroupEntity> {
    const client = options.client ?? this.#pool;
    const logger = options.logger;

    logger.debug({ name: groupCreateEntity.name }, 'Creating group');

    const query = `
      INSERT INTO groups (name, description)
      VALUES ($1, $2) RETURNING *
    `;

    const result = await client.query<IGroupRowData>(query, [groupCreateEntity.name, groupCreateEntity.description]);

    const row = result.rows?.[0];
    if (!row) throw new Error('Group not created');

    logger.debug({ id: row.id }, 'Group created');

    return this.#buildGroupEntity(row);
  }

  async findOne(
    groupFindOneEntity: GroupFindOneEntity,
    options: { client?: PoolClient; logger: ILogger },
  ): Promise<GroupEntity | null> {
    const client = options.client ?? this.#pool;
    const logger = options.logger;

    logger.debug({ id: groupFindOneEntity.id }, 'Finding group');

    let query = 'SELECT * FROM groups';
    const { conditions, values } = this.#buildGroupsConditions(groupFindOneEntity);
    if (conditions.length === 0) throw new Error('Invalid find params');

    query += ' WHERE ' + conditions.join(' AND ');

    const result = await client.query<IGroupRowData>(query, values);
    const row = result.rows?.[0];

    if (!row) {
      logger.debug({ id: groupFindOneEntity.id }, 'Group not found');
      return null;
    }

    logger.debug({ id: row.id }, 'Group found');
    return this.#buildGroupEntity(row);
  }

  async findMany(
    groupFindManyEntity: GroupFindManyEntity,
    options: { client?: PoolClient; logger: ILogger },
  ): Promise<GroupEntity[]> {
    const client = options.client ?? this.#pool;
    const logger = options.logger;

    logger.debug({ ids: groupFindManyEntity?.ids, name: groupFindManyEntity?.name }, 'Finding groups');

    const { conditions, values } = this.#buildGroupsConditions(groupFindManyEntity);

    const query = `
      SELECT * FROM groups
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
      ORDER BY created_at DESC
    `;

    const result = await client.query<IGroupRowData>(query, values);
    const groups = result.rows.map((row) => this.#buildGroupEntity(row));

    logger.debug({ count: groups.length }, 'Groups found');
    return groups;
  }

  async patchOne(
    {
      groupFindOneEntity,
      groupPatchOneEntity,
    }: {
      groupFindOneEntity: GroupFindOneEntity;
      groupPatchOneEntity: GroupPatchOneEntity;
    },
    options: { client?: PoolClient; logger: ILogger },
  ): Promise<GroupEntity> {
    const client = options.client ?? this.#pool;
    const logger = options.logger;

    logger.debug({ id: groupFindOneEntity.id }, 'Patching group');

    const { conditions: findConditions, values: findValues } = this.#buildGroupsConditions(groupFindOneEntity);
    if (findConditions.length === 0) throw new Error('Invalid find params');

    const { setParts, updateValues } = this.#buildUpdateSetClause(groupPatchOneEntity, findValues.length + 1);
    if (setParts.length === 0) throw new Error('No fields to update');

    const query = `
        UPDATE groups
        SET ${setParts.join(', ')}
        WHERE ${findConditions.join(' AND ')}
        RETURNING *
      `;
    const allValues = [...findValues, ...updateValues];
    const result = await client.query<IGroupRowData>(query, allValues);

    const row = result.rows?.[0];
    if (!row) throw new Error('Group not found or not updated');

    logger.debug({ id: row.id }, 'Group patched');
    return this.#buildGroupEntity(row);
  }

  async deleteOne(
    groupFindOneEntity: GroupFindOneEntity,
    options: { client?: PoolClient; logger: ILogger },
  ): Promise<void> {
    const client = options.client ?? this.#pool;
    const logger = options.logger;

    logger.debug({ id: groupFindOneEntity.id }, 'Deleting group');

    const { conditions, values } = this.#buildGroupsConditions(groupFindOneEntity);
    if (conditions.length === 0) throw new Error('Invalid delete params');

    const query = `
      DELETE FROM groups
      WHERE ${conditions.join(' AND ')}
    `;

    await client.query(query, values);

    logger.debug({ id: groupFindOneEntity.id }, 'Group deleted');
  }

  #buildGroupsConditions(findEntity: GroupFindOneEntity | GroupFindManyEntity | undefined) {
    const conditions: string[] = [];
    const values: (string | number | boolean | UUID[])[] = [];
    let valueIndex = 1;

    if (!findEntity) {
      return { conditions, values };
    }

    if ('id' in findEntity && findEntity.id) {
      conditions.push(`id = $${valueIndex}`);
      values.push(findEntity.id);
      valueIndex++;
    }

    if ('ids' in findEntity && findEntity.ids && findEntity.ids.length > 0) {
      const placeholders = findEntity.ids.map((_, i) => `$${valueIndex + i}`).join(', ');
      conditions.push(`id IN (${placeholders})`);
      values.push(...findEntity.ids);
      valueIndex += findEntity.ids.length;
    }

    if ('name' in findEntity && findEntity.name) {
      conditions.push(`name ILIKE $${valueIndex}`);
      values.push(`%${findEntity.name}%`);
      valueIndex++;
    }

    return { conditions, values };
  }

  #buildUpdateSetClause(groupPatchEntity: GroupPatchOneEntity, startValueIndex: number) {
    const setParts: string[] = [];
    const updateValues: (string | null)[] = [];
    let valueIndex = startValueIndex;

    if (groupPatchEntity.name !== undefined) {
      setParts.push(`name = $${valueIndex}`);
      updateValues.push(groupPatchEntity.name);
      valueIndex++;
    }

    if (groupPatchEntity.description !== undefined) {
      setParts.push(`description = $${valueIndex}`);
      updateValues.push(groupPatchEntity.description);
      valueIndex++;
    }

    return { setParts, updateValues, nextValueIndex: valueIndex };
  }

  #buildGroupEntity(row: IGroupRowData) {
    return new GroupEntity({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      createdAt: row.created_at,
    });
  }
}
