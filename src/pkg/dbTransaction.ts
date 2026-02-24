import { Pool, PoolClient } from 'pg';

export interface IDbTransactionService {
  executeInTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
}

export class DbTransactionService implements IDbTransactionService {
  readonly #pool: Pool;

  constructor(pool: Pool) {
    this.#pool = pool;
  }

  async executeInTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.#pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
