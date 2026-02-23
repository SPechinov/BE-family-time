import { PoolClient } from 'pg';
import { IUsersGroupsRepository } from '@/domains/repositories/db';
import {
  UsersGroupsEntity,
  UsersGroupsCreateEntity,
  UsersGroupsFindOneEntity,
  UsersGroupsDeleteEntity,
  UsersGroupsFindManyEntity,
} from '@/entities';
import { IUsersGroupsRowData } from './types';
import { UUID } from 'node:crypto';
import { BaseRepository } from '../baseRepository';

export class UsersGroupsRepository extends BaseRepository implements IUsersGroupsRepository {
  async createOne(
    usersGroupsCreateEntity: UsersGroupsCreateEntity,
    options?: { client?: PoolClient },
  ): Promise<UsersGroupsEntity> {
    const client = options?.client ?? this.pool;
    const query = `
      INSERT INTO users_groups (user_id, group_id, is_owner)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, group_id) DO NOTHING
      RETURNING *
    `;

    const result = await client.query<IUsersGroupsRowData>(query, [
      usersGroupsCreateEntity.userId,
      usersGroupsCreateEntity.groupId,
      usersGroupsCreateEntity.isOwner,
    ]);

    const row = result.rows?.[0];
    if (!row) throw new Error('User-Group relation not created');

    return this.#buildUsersGroupsEntity(row);
  }

  async findOne(usersGroupsFindOneEntity: UsersGroupsFindOneEntity): Promise<UsersGroupsEntity | null> {
    const { conditions, values, joinClause } = this.#buildUsersGroupsConditions(usersGroupsFindOneEntity);
    if (conditions.length === 0) throw new Error('Invalid find params');

    const query = `
      SELECT ug.*, g.deleted
      FROM users_groups ug
      ${joinClause}
      WHERE ${conditions.join(' AND ')}
    `;

    const result = await this.pool.query<IUsersGroupsRowData>(query, values);
    const row = result.rows?.[0];
    if (!row) return null;
    return this.#buildUsersGroupsEntity(row);
  }

  async findMany(options: UsersGroupsFindManyEntity): Promise<UsersGroupsEntity[]> {
    const { query, values, joinClause } = this.#buildFindManyQuery(options);
    const result = await this.pool.query<IUsersGroupsRowData>(query, values);

    return result.rows.map((row) => this.#buildUsersGroupsEntity(row));
  }

  async count(options: UsersGroupsFindManyEntity): Promise<number> {
    const { query, values } = this.#buildFindManyQuery(options);
    const countQuery = query.replace('SELECT ug.*', 'SELECT COUNT(*)');
    const result = await this.pool.query<{ count: string }>(countQuery, values);

    return parseInt(result.rows[0].count, 10);
  }

  async deleteOne(usersGroupsDeleteEntity: UsersGroupsDeleteEntity): Promise<void> {
    const query = `
      DELETE FROM users_groups
      WHERE user_id = $1 AND group_id = $2
    `;

    await this.pool.query(query, [usersGroupsDeleteEntity.userId, usersGroupsDeleteEntity.groupId]);
  }

  async deleteAllByUserId(userId: UUID): Promise<void> {
    const query = 'DELETE FROM users_groups WHERE user_id = $1';
    await this.pool.query(query, [userId]);
  }

  async deleteAllByGroupId(groupId: UUID): Promise<void> {
    const query = 'DELETE FROM users_groups WHERE group_id = $1';
    await this.pool.query(query, [groupId]);
  }

  #buildUsersGroupsConditions(usersGroupsFindOneEntity: UsersGroupsFindOneEntity) {
    const conditions: string[] = [];
    const values: (UUID | boolean)[] = [];
    let valueIndex = 1;
    let joinClause = '';

    if (usersGroupsFindOneEntity.userId) {
      conditions.push(`ug.user_id = $${valueIndex}`);
      values.push(usersGroupsFindOneEntity.userId);
      valueIndex++;
    }

    if (usersGroupsFindOneEntity.groupId) {
      conditions.push(`ug.group_id = $${valueIndex}`);
      values.push(usersGroupsFindOneEntity.groupId);
      valueIndex++;
    }

    if (usersGroupsFindOneEntity.isOwner !== undefined) {
      conditions.push(`ug.is_owner = $${valueIndex}`);
      values.push(usersGroupsFindOneEntity.isOwner);
      valueIndex++;
    }

    if (usersGroupsFindOneEntity.deleted !== undefined) {
      joinClause = 'INNER JOIN groups g ON ug.group_id = g.id';
      conditions.push(`g.deleted = $${valueIndex}`);
      values.push(usersGroupsFindOneEntity.deleted);
      valueIndex++;
    }

    return { conditions, values, joinClause };
  }

  #buildFindManyQuery({ userId, groupId, isOwner, deleted }: UsersGroupsFindManyEntity) {
    const conditions: string[] = [];
    const values: (UUID | boolean)[] = [];
    let valueIndex = 1;
    let joinClause = '';

    if (userId !== undefined) {
      conditions.push(`ug.user_id = $${valueIndex}`);
      values.push(userId);
      valueIndex++;
    }

    if (groupId !== undefined) {
      conditions.push(`ug.group_id = $${valueIndex}`);
      values.push(groupId);
      valueIndex++;
    }

    if (isOwner !== undefined) {
      conditions.push(`ug.is_owner = $${valueIndex}`);
      values.push(isOwner);
      valueIndex++;
    }

    if (deleted !== undefined) {
      joinClause = 'INNER JOIN groups g ON ug.group_id = g.id';
      conditions.push(`g.deleted = $${valueIndex}`);
      values.push(deleted);
      valueIndex++;
    }

    const query = `
      SELECT ug.*, g.deleted
      FROM users_groups ug
      ${joinClause}
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `;

    return { query, values, joinClause };
  }

  #buildUsersGroupsEntity(row: IUsersGroupsRowData) {
    return new UsersGroupsEntity({
      userId: row.user_id,
      groupId: row.group_id,
      isOwner: row.is_owner,
      createdAt: row.created_at,
      deleted: row.deleted,
    });
  }
}
