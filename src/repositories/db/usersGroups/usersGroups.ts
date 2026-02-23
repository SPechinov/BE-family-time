import { Pool, PoolClient } from 'pg';
import { IUsersGroupsRepository } from '@/domains/repositories/db';
import {
  UsersGroupsEntity,
  UsersGroupsCreateEntity,
  UsersGroupsFindOneEntity,
  UsersGroupsDeleteEntity,
} from '@/entities';
import { IUsersGroupsRowData } from './types';
import { UUID } from 'node:crypto';

export class UsersGroupsRepository implements IUsersGroupsRepository {
  #pool: Pool;

  constructor(props: { pool: Pool }) {
    this.#pool = props.pool;
  }

  async createOne(
    usersGroupsCreateEntity: UsersGroupsCreateEntity,
    options?: { client?: PoolClient },
  ): Promise<UsersGroupsEntity> {
    const client = options?.client ?? this.#pool;
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
    let query = 'SELECT * FROM users_groups';
    const { conditions, values } = this.#buildUsersGroupsConditions(usersGroupsFindOneEntity);
    if (conditions.length === 0) throw new Error('Invalid find params');

    query += ' WHERE ' + conditions.join(' AND ');

    const result = await this.#pool.query<IUsersGroupsRowData>(query, values);
    const row = result.rows?.[0];
    if (!row) return null;
    return this.#buildUsersGroupsEntity(row);
  }

  async findAllByUserId(userId: UUID): Promise<UsersGroupsEntity[]> {
    const query = `
      SELECT ug.*
      FROM users_groups ug
      INNER JOIN groups g ON ug.group_id = g.id
      WHERE ug.user_id = $1 AND g.deleted = false
    `;
    const result = await this.#pool.query<IUsersGroupsRowData>(query, [userId]);

    return result.rows.map((row) => this.#buildUsersGroupsEntity(row));
  }

  async countAllByUserId(userId: UUID): Promise<number> {
    const query = `
      SELECT COUNT(*)
      FROM users_groups ug
      INNER JOIN groups g ON ug.group_id = g.id
      WHERE ug.user_id = $1 AND g.deleted = false
    `;
    const result = await this.#pool.query<{ count: string }>(query, [userId]);

    return parseInt(result.rows[0].count, 10);
  }

  async findAllByGroupId(groupId: UUID): Promise<UsersGroupsEntity[]> {
    const query = 'SELECT * FROM users_groups WHERE group_id = $1';
    const result = await this.#pool.query<IUsersGroupsRowData>(query, [groupId]);

    return result.rows.map((row) => this.#buildUsersGroupsEntity(row));
  }

  async deleteOne(usersGroupsDeleteEntity: UsersGroupsDeleteEntity): Promise<void> {
    const query = `
      DELETE FROM users_groups
      WHERE user_id = $1 AND group_id = $2
    `;

    await this.#pool.query(query, [usersGroupsDeleteEntity.userId, usersGroupsDeleteEntity.groupId]);
  }

  #buildUsersGroupsConditions(usersGroupsFindOneEntity: UsersGroupsFindOneEntity) {
    const conditions: string[] = [];
    const values: (UUID | boolean)[] = [];
    let valueIndex = 1;

    if (usersGroupsFindOneEntity.userId) {
      conditions.push(`user_id = $${valueIndex}`);
      values.push(usersGroupsFindOneEntity.userId);
      valueIndex++;
    }

    if (usersGroupsFindOneEntity.groupId) {
      conditions.push(`group_id = $${valueIndex}`);
      values.push(usersGroupsFindOneEntity.groupId);
      valueIndex++;
    }

    if (usersGroupsFindOneEntity.isOwner !== undefined) {
      conditions.push(`is_owner = $${valueIndex}`);
      values.push(usersGroupsFindOneEntity.isOwner);
      valueIndex++;
    }

    return { conditions, values };
  }

  #buildUsersGroupsEntity(row: IUsersGroupsRowData) {
    return new UsersGroupsEntity({
      userId: row.user_id,
      groupId: row.group_id,
      isOwner: row.is_owner,
      createdAt: row.created_at,
    });
  }
}
