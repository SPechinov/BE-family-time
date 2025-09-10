import { Pool } from 'pg';
import { IUserRepository } from '@/domain/repositories/db';

export class UserRepository implements IUserRepository {
  #pool: Pool;

  constructor(props: { pool: Pool }) {
    this.#pool = props.pool;
  }
}
