import { Pool } from 'pg';
import { IBaseRepository } from '@/domains/repositories/db';

export abstract class BaseRepository implements IBaseRepository {
  readonly #pool: Pool;

  constructor(pool: Pool) {
    this.#pool = pool;
  }

  protected get pool(): Pool {
    return this.#pool;
  }
}
