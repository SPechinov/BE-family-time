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
      ON CONFLICT (user_id, group_id) DO UPDATE SET is_owner = EXCLUDED.is_owner
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
    const { conditions, values } = this.#buildConditions(usersGroupsFindOneEntity);
    if (conditions.length === 0) return null;

    const query = `
      SELECT *
      FROM users_groups ug
      WHERE ${conditions.join(' AND ')}
    `;

    const result = await this.pool.query<IUsersGroupsRowData>(query, values);
    const row = result.rows?.[0];
    if (!row) return null;
    return this.#buildUsersGroupsEntity(row);
  }

  async findMany(usersGroupsFindManyEntity: UsersGroupsFindManyEntity): Promise<UsersGroupsEntity[]> {
    const { conditions, values } = this.#buildConditions(usersGroupsFindManyEntity);

    const query = `
      SELECT *
      FROM users_groups ug
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `;

    const result = await this.pool.query<IUsersGroupsRowData>(query, values);
    return result.rows.map((row) => this.#buildUsersGroupsEntity(row));
  }

  async count(usersGroupsFindManyEntity: UsersGroupsFindManyEntity): Promise<number> {
    const { conditions, values } = this.#buildConditions(usersGroupsFindManyEntity);

    const query = `
      SELECT COUNT(*)
      FROM users_groups ug
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `;

    const result = await this.pool.query<{ count: string }>(query, values);
    return parseInt(result.rows[0].count, 10);
  }

  #buildConditions({ userId, groupId, isOwner }: UsersGroupsFindManyEntity) {
    const conditions: string[] = [];
    const values: (UUID | boolean)[] = [];
    let valueIndex = 1;

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

    return { conditions, values };
  }

  async deleteOne(usersGroupsDeleteEntity: UsersGroupsDeleteEntity): Promise<void> {
    const query = `
      DELETE FROM users_groups
      WHERE user_id = $1 AND group_id = $2
    `;

    await this.pool.query(query, [usersGroupsDeleteEntity.userId, usersGroupsDeleteEntity.groupId]);
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
