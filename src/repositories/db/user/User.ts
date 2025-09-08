import { IUserRepository } from '../../../domain/repositories';
import { Pool } from 'pg';

export class UserRepository implements IUserRepository {
  #pool: Pool;

  constructor(props: { pool: Pool }) {
    this.#pool = props.pool;
  }
}
