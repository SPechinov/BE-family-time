import { PoolClient } from 'pg';

export interface IDbTransactionService {
  executeInTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
}
