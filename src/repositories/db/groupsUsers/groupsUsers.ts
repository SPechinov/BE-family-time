import { Pool, PoolClient } from 'pg';
import { IGroupsUsersRepository } from '@/domains/repositories/db';
import {
  GroupsUsersEntity,
  GroupsUsersCreateEntity,
  GroupsUsersFindOneEntity,
  GroupsUsersDeleteOneEntity,
  GroupsUsersFindManyEntity,
  UserId,
  GroupId,
} from '@/entities';
import { IGroupsUsersRowData } from './types';
import { ILogger } from '@/pkg/logger';

export class GroupsUsersRepository implements IGroupsUsersRepository {
  readonly #pool: Pool;

  constructor(pool: Pool) {
    this.#pool = pool;
  }

  async createOne(
    groupsUsersCreateEntity: GroupsUsersCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<GroupsUsersEntity> {
    const client = options?.client ?? this.#pool;

    const query = `
      INSERT INTO groups_users (group_id, user_id, is_owner)
      VALUES ($1, $2, $3)
      ON CONFLICT (group_id, user_id) DO UPDATE SET is_owner = EXCLUDED.is_owner
      RETURNING *
    `;

    const values = [groupsUsersCreateEntity.groupId, groupsUsersCreateEntity.userId, groupsUsersCreateEntity.isOwner];

    options?.logger?.debug({ query, values }, 'GroupsUsers repository: createOne');

    const result = await client.query<IGroupsUsersRowData>(query, values);

    const row = result.rows?.[0];
    if (!row) throw new Error('User-Group relation not created');

    return this.#buildGroupsUsersEntity(row);
  }

  async findOne(
    groupsUsersFindOneEntity: GroupsUsersFindOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<GroupsUsersEntity | null> {
    const client = options?.client ?? this.#pool;

    const { conditions, values } = this.#buildConditions(groupsUsersFindOneEntity);
    if (conditions.length === 0) return null;

    const query = `
      SELECT *
      FROM groups_users gu
      WHERE ${conditions.join(' AND ')}
    `;

    options?.logger?.debug({ query, values }, 'GroupsUsers repository: findOne');

    const result = await client.query<IGroupsUsersRowData>(query, values);
    const row = result.rows?.[0];
    if (!row) return null;
    return this.#buildGroupsUsersEntity(row);
  }

  async findMany(
    groupsUsersFindManyEntity: GroupsUsersFindManyEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<GroupsUsersEntity[]> {
    const client = options?.client ?? this.#pool;

    const { conditions, values } = this.#buildConditions(groupsUsersFindManyEntity);

    const query = `
      SELECT *
      FROM groups_users gu
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `;

    options?.logger?.debug({ query, values }, 'GroupsUsers repository: findMany');

    const result = await client.query<IGroupsUsersRowData>(query, values);
    return result.rows.map((row) => this.#buildGroupsUsersEntity(row));
  }

  async count(
    groupsUsersFindManyEntity: GroupsUsersFindManyEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<number> {
    const client = options?.client ?? this.#pool;

    const { conditions, values } = this.#buildConditions(groupsUsersFindManyEntity);

    const query = `
      SELECT COUNT(*)
      FROM groups_users gu
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `;

    options?.logger?.debug({ query, values }, 'GroupsUsers repository: count');
    const result = await client.query<{ count: string }>(query, values);
    return parseInt(result.rows[0].count, 10);
  }

  async deleteOne(
    groupsUsersDeleteEntity: GroupsUsersDeleteOneEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void> {
    const client = options?.client ?? this.#pool;

    const query = `
      DELETE FROM groups_users
      WHERE group_id = $1 AND user_id = $2
    `;

    const values = [groupsUsersDeleteEntity.groupId, groupsUsersDeleteEntity.userId];

    options?.logger?.debug({ query, values }, 'GroupsUsers repository: deleteOne');

    await client.query(query, values);
  }

  #buildConditions({ userId, groupId, isOwner }: GroupsUsersFindManyEntity) {
    const conditions: string[] = [];
    const values: (UserId | GroupId | boolean)[] = [];
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

  #buildGroupsUsersEntity(row: IGroupsUsersRowData) {
    return new GroupsUsersEntity({
      groupId: row.group_id,
      userId: row.user_id,
      isOwner: row.is_owner,
      createdAt: row.created_at,
    });
  }
}
