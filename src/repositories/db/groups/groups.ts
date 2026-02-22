import { Pool } from 'pg';
import { IGroupsRepository } from '@/domains/repositories/db';
import { GroupCreateEntity, GroupEntity, GroupFindOneEntity, GroupPatchOneEntity } from '@/entities';
import { IGroupRowData } from './types';

export class GroupsRepository implements IGroupsRepository {
  #pool: Pool;

  constructor(props: { pool: Pool }) {
    this.#pool = props.pool;
  }

  async createOne(groupCreateEntity: GroupCreateEntity): Promise<GroupEntity> {
    const query = `
      INSERT INTO groups (name, description)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await this.#pool.query<IGroupRowData>(query, [
      groupCreateEntity.name,
      groupCreateEntity.description,
    ]);

    const row = result.rows?.[0];
    if (!row) throw new Error('Group not created');

    return this.#buildGroupEntity(row);
  }

  async findOne(groupFindOneEntity: GroupFindOneEntity): Promise<GroupEntity | null> {
    let query = 'SELECT * FROM groups';
    const { conditions, values } = this.#buildGroupsConditions(groupFindOneEntity);
    if (conditions.length === 0) throw new Error('Invalid find params');

    query += ' WHERE ' + conditions.join(' AND ');

    const result = await this.#pool.query<IGroupRowData>(query, values);
    const row = result.rows?.[0];
    if (!row) return null;
    return this.#buildGroupEntity(row);
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
    const result = await this.#pool.query<IGroupRowData>(query, allValues);

    const row = result.rows?.[0];
    if (!row) throw new Error('Group not found or not updated');

    return this.#buildGroupEntity(row);
  }

  #buildGroupsConditions(groupFindOneEntity: GroupFindOneEntity) {
    const conditions: string[] = [];
    const values: (string | number | boolean)[] = [];
    let valueIndex = 1;

    if (groupFindOneEntity.id) {
      conditions.push(`id = $${valueIndex}`);
      values.push(groupFindOneEntity.id);
      valueIndex++;
    }

    if (groupFindOneEntity.deleted !== undefined) {
      conditions.push(`deleted = $${valueIndex}`);
      values.push(groupFindOneEntity.deleted);
      valueIndex++;
    }

    return { conditions, values };
  }

  #buildUpdateSetClause(groupPatchEntity: GroupPatchOneEntity, startValueIndex: number) {
    const setParts: string[] = [];
    const updateValues: (string | boolean | null)[] = [];
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

    if (groupPatchEntity.delete !== undefined) {
      setParts.push(`deleted = $${valueIndex}`);
      updateValues.push(groupPatchEntity.delete);
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
      deleted: row.deleted,
      deletedAt: row.deleted_at ?? undefined,
    });
  }
}
