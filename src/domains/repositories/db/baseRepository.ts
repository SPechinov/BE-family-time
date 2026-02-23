import { PoolClient } from 'pg';

export interface IBaseRepository {
  withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
}
