import { GroupId, UserId } from '@/entities';
import { ILogger } from '@/pkg/logger';
import { PoolClient } from 'pg';

export const buildOptions = (logger: ILogger, client?: PoolClient): { logger: ILogger; client?: PoolClient } => {
  return { logger, client };
};

export const lockUserGroupsScope = async (userId: UserId, client: PoolClient): Promise<void> => {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`groups:user:${userId}`]);
};

export const lockGroupMembersScope = async (groupId: GroupId, client: PoolClient): Promise<void> => {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`groups:group:${groupId}`]);
};
