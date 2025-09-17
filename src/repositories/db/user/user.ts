import { Pool } from 'pg';
import { IUsersRepository } from '@/domain/repositories/db';
import {
  UserContactsEncryptedEntity,
  UserContactsHashedEntity,
  UserCreateEntity,
  UserEntity,
  UserFindEntity, UserPatchEntity,
  UserPersonalInfoEntity
} from '@/domain/entities';
import { IUserRowData } from './types';

export class UsersRepository implements IUsersRepository {
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
    if (!row) throw new Error('User not created');

    return this.#buildUserEntity(row);
  }

  async findOne(userFindEntity: UserFindEntity) {
    let query = 'SELECT * FROM users';
    const { conditions, values } = this.#buildUsersConditions(userFindEntity);
    if (conditions.length === 0) throw new Error('Invalid find params');

    query += ' WHERE ' + conditions.join(' AND ');

    const result = await this.#pool.query<IUserRowData>(query, values);
    const row = result.rows?.[0];
    if (!row) return null;
    return this.#buildUserEntity(row);
  }

  patch(props: { userFindEntity: UserFindEntity; userPatchEntity: UserPatchEntity }) {
    const { conditions, values } = this.#buildUsersConditions(props.userFindEntity);
    if (conditions.length === 0) throw new Error('Invalid find params');
    const where = 'WHERE ' + conditions.join(' AND ');

    const query = `
      UPDATE users
    `
  }

  #buildUpdateSetClause(userPatchEntity: UserPatchEntity, startIndex: number) {
    const setParts: string[] = [];
    const setValues: (string | Buffer)[] = [];
    let valueIndex = startIndex;

    if (userPatchEntity.contactsHashed?.email !== undefined) {
      setParts.push(`email_hashed = $${valueIndex}`);
      setValues.push(Buffer.from(userPatchEntity.contactsHashed.email, 'utf-8'));
      valueIndex++;
    }

    if (userPatchEntity.contactsEncrypted?.email !== undefined) {
      setParts.push(`email_encrypted = $${valueIndex}`);
      setValues.push(Buffer.from(userPatchEntity.contactsEncrypted.email, 'utf-8'));
      valueIndex++;
    }

    if (userPatchEntity.contactsHashed?.phone !== undefined) {
      setParts.push(`phone_hashed = $${valueIndex}`);
      setValues.push(Buffer.from(userPatchEntity.contactsHashed.phone, 'utf-8'));
      valueIndex++;
    }

    if (userPatchEntity.contactsEncrypted?.phone !== undefined) {
      setParts.push(`phone_encrypted = $${valueIndex}`);
      setValues.push(Buffer.from(userPatchEntity.contactsEncrypted.phone, 'utf-8'));
      valueIndex++;
    }

    if (userPatchEntity.passwordHashed !== undefined) {
      setParts.push(`password_hashed = $${valueIndex}`);
      setValues.push(Buffer.from(userPatchEntity.passwordHashed, 'utf-8'));
      valueIndex++;
    }

    if (userPatchEntity.personalInfo?.firstName !== undefined) {
      setParts.push(`first_name = $${valueIndex}`);
      setValues.push(userPatchEntity.personalInfo.firstName);
      valueIndex++;
    }

    if (userPatchEntity.personalInfo?.lastName !== undefined) {
      setParts.push(`last_name = $${valueIndex}`);
      setValues.push(userPatchEntity.personalInfo.lastName);
      valueIndex++;
    }

    return { setParts, setValues };
  }


  #buildUsersConditions(userFindEntity: UserFindEntity) {
    const conditions: string[] = [];
    const values: (string | Buffer)[] = [];
    let valueIndex = 1;

    if (userFindEntity.id !== undefined) {
      conditions.push(`id = $${valueIndex}`);
      values.push(userFindEntity.id);
      valueIndex++;
    }

    if (userFindEntity.contactsHashed?.email !== undefined) {
      conditions.push(`email_hashed = $${valueIndex}`);
      values.push(Buffer.from(userFindEntity.contactsHashed.email, 'utf-8'));
      valueIndex++;
    }

    if (userFindEntity.contactsHashed?.phone !== undefined) {
      conditions.push(`phone_hashed = $${valueIndex}`);
      values.push(Buffer.from(userFindEntity.contactsHashed.phone, 'utf-8'));
      valueIndex++;
    }

    return { conditions, values };
  }

  #buildUserEntity(row: IUserRowData) {
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
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
