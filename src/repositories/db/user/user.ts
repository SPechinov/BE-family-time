import { Pool } from 'pg';
import { IUserRepository } from '@/domain/repositories/db';
import {
  UserContactsEncryptedEntity,
  UserContactsHashedEntity,
  UserCreateEntity,
  UserEntity,
  UserPersonalInfoEntity,
} from '@/domain/entities';
import { ServerError } from '@/api/rest/errors';
import { IUserRowData } from './types';

export class UserRepository implements IUserRepository {
  #pool: Pool;

  constructor(props: { pool: Pool }) {
    this.#pool = props.pool;
  }

  async create(userCreateEntity: UserCreateEntity): Promise<UserEntity> {
    const query = `
      INSERT INTO users (email_hashed,
                         email_encrypted,
                         phone_hashed,
                         phone_encrypted,
                         password_hashed,
                         first_name,
                         last_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await this.#pool.query<IUserRowData>(query, [
      userCreateEntity.contactsHashed.email,
      userCreateEntity.contactsEncrypted.email,
      userCreateEntity.contactsHashed.phone,
      userCreateEntity.contactsEncrypted.phone,
      userCreateEntity.passwordHashed,
      userCreateEntity.personalInfo.firstName,
      userCreateEntity.personalInfo.lastName,
    ]);

    const row = result.rows?.[0];
    if (!row) throw new ServerError({ message: 'User not created' });

    const personalInfo = new UserPersonalInfoEntity({
      firstName: row.first_name,
      lastName: row.last_name || undefined,
    });

    const contactsHashed = new UserContactsHashedEntity({
      email: row.email_hashed?.toString('utf-8'),
      phone: row.phone_hashed?.toString('utf-8'),
    });

    const contactsEncrypted = new UserContactsEncryptedEntity({
      email: row.email_encrypted?.toString('utf-8'),
      phone: row.phone_encrypted?.toString('utf-8'),
    });

    return new UserEntity({
      id: row.id,
      personalInfo,
      contactsHashed,
      contactsEncrypted,
      passwordHashed: row.password_hashed?.toString('utf-8'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
