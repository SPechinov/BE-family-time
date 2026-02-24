import { PoolClient } from 'pg';
import { IGroupsRepository } from '@/domains/repositories/db';
import {
  GroupCreateEntity,
  GroupFindManyEntity,
  GroupEntity,
  GroupFindOneEntity,
  GroupPatchOneEntity,
} from '@/entities';
import { IGroupRowData } from './types';
import { BaseRepository } from '../baseRepository';
import { UUID } from 'node:crypto';

export class GroupsRepository extends BaseRepository implements IGroupsRepository {
  async createOne(groupCreateEntity: GroupCreateEntity, options?: { client?: PoolClient }): Promise<GroupEntity> {
    const client = options?.client ?? this.pool;
    const query = `
      INSERT INTO groups (name, description)
      VALUES ($1, $2) RETURNING *
    `;

    const result = await client.query<IGroupRowData>(query, [groupCreateEntity.name, groupCreateEntity.description]);

    const row = result.rows?.[0];
    if (!row) throw new Error('Group not created');

    return this.#buildGroupEntity(row);
  }

  async findOne(groupFindOneEntity: GroupFindOneEntity): Promise<GroupEntity | null> {
    let query = 'SELECT * FROM groups';
    const { conditions, values } = this.#buildGroupsConditions(groupFindOneEntity);
    if (conditions.length === 0) throw new Error('Invalid find params');

    query += ' WHERE ' + conditions.join(' AND ');

    const result = await this.pool.query<IGroupRowData>(query, values);
    const row = result.rows?.[0];
    if (!row) return null;
    return this.#buildGroupEntity(row);
  }

  async findMany(groupFindManyEntity?: GroupFindManyEntity): Promise<GroupEntity[]> {
    const { conditions, values } = this.#buildGroupsConditions(groupFindManyEntity);

    const query = `
      SELECT * FROM groups
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query<IGroupRowData>(query, values);
    return result.rows.map((row) => this.#buildGroupEntity(row));
  }

  async patchOne({
    groupFindOneEntity,
    groupPatchOneEntity,
  }: {
    groupFindOneEntity: GroupFindOneEntity;
    groupPatchOneEntity: GroupPatchOneEntity;
  }): Promise<GroupEntity> {
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
    const result = await this.pool.query<IGroupRowData>(query, allValues);

    const row = result.rows?.[0];
    if (!row) throw new Error('Group not found or not updated');

    return this.#buildGroupEntity(row);
  }

  async deleteOne(groupFindOneEntity: GroupFindOneEntity): Promise<void> {
    const { conditions, values } = this.#buildGroupsConditions(groupFindOneEntity);
    if (conditions.length === 0) throw new Error('Invalid delete params');

    const query = `
      DELETE FROM groups
      WHERE ${conditions.join(' AND ')}
    `;

    await this.pool.query(query, values);
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
