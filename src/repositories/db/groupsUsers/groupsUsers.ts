import { PoolClient } from 'pg';
import { IGroupsUsersRepository } from '@/domains/repositories/db';
import {
  GroupsUsersEntity,
  GroupsUsersCreateEntity,
  GroupsUsersFindOneEntity,
  GroupsUsersDeleteOneEntity,
  GroupsUsersFindManyEntity,
} from '@/entities';
import { IGroupsUsersRowData } from './types';
import { UUID } from 'node:crypto';
import { BaseRepository } from '../baseRepository';

export class GroupsUsersRepository extends BaseRepository implements IGroupsUsersRepository {
  async createOne(
    groupsUsersCreateEntity: GroupsUsersCreateEntity,
    options?: { client?: PoolClient },
  ): Promise<GroupsUsersEntity> {
    const client = options?.client ?? this.pool;
    const query = `
      INSERT INTO groups_users (group_id, user_id, is_owner)
      VALUES ($1, $2, $3)
      ON CONFLICT (group_id, user_id) DO UPDATE SET is_owner = EXCLUDED.is_owner
      RETURNING *
    `;

    const result = await client.query<IGroupsUsersRowData>(query, [
      groupsUsersCreateEntity.groupId,
      groupsUsersCreateEntity.userId,
      groupsUsersCreateEntity.isOwner,
    ]);

    const row = result.rows?.[0];
    if (!row) throw new Error('User-Group relation not created');

    return this.#buildGroupsUsersEntity(row);
  }

  async findOne(groupsUsersFindOneEntity: GroupsUsersFindOneEntity): Promise<GroupsUsersEntity | null> {
    const { conditions, values } = this.#buildConditions(groupsUsersFindOneEntity);
    if (conditions.length === 0) return null;

    const query = `
      SELECT *
      FROM groups_users gu
      WHERE ${conditions.join(' AND ')}
    `;

    const result = await this.pool.query<IGroupsUsersRowData>(query, values);
    const row = result.rows?.[0];
    if (!row) return null;
    return this.#buildGroupsUsersEntity(row);
  }

  async findMany(groupsUsersFindManyEntity: GroupsUsersFindManyEntity): Promise<GroupsUsersEntity[]> {
    const { conditions, values } = this.#buildConditions(groupsUsersFindManyEntity);

    const query = `
      SELECT *
      FROM groups_users gu
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `;

    const result = await this.pool.query<IGroupsUsersRowData>(query, values);
    return result.rows.map((row) => this.#buildGroupsUsersEntity(row));
  }

  async count(groupsUsersFindManyEntity: GroupsUsersFindManyEntity): Promise<number> {
    const { conditions, values } = this.#buildConditions(groupsUsersFindManyEntity);

    const query = `
      SELECT COUNT(*)
      FROM groups_users gu
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `;

    const result = await this.pool.query<{ count: string }>(query, values);
    return parseInt(result.rows[0].count, 10);
  }

  #buildConditions({ userId, groupId, isOwner }: GroupsUsersFindManyEntity) {
    const conditions: string[] = [];
    const values: (UUID | boolean)[] = [];
    let valueIndex = 1;

    if (groupId !== undefined) {
      conditions.push(`gu.group_id = $${valueIndex}`);
      values.push(groupId);
      valueIndex++;
    }

    if (userId !== undefined) {
      conditions.push(`gu.user_id = $${valueIndex}`);
      values.push(userId);
      valueIndex++;
    }

    if (isOwner !== undefined) {
      conditions.push(`gu.is_owner = $${valueIndex}`);
      values.push(isOwner);
      valueIndex++;
    }

    return { conditions, values };
  }

  async deleteOne(groupsUsersDeleteEntity: GroupsUsersDeleteOneEntity): Promise<void> {
    const query = `
      DELETE FROM groups_users
      WHERE group_id = $1 AND user_id = $2
    `;

    await this.pool.query(query, [groupsUsersDeleteEntity.groupId, groupsUsersDeleteEntity.userId]);
  }

  #buildGroupsUsersEntity(row: IGroupsUsersRowData) {
    return new GroupsUsersEntity({
      groupId: row.group_id,
      userId: row.user_id,
      isOwner: row.is_owner,
      createdAt: row.created_at,
    });
  }
}
