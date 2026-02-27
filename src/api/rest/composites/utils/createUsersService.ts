import { Pool } from 'pg';
import { UsersService, HmacService, HashPasswordService, EncryptionService } from '@/services';
import { IUsersService } from '@/domains/services';
import { UsersRepository } from '@/repositories/db';
import { CONFIG } from '@/config';

export const createUsersService = (props: { postgres: Pool }): IUsersService => {
  return new UsersService({
    usersRepository: new UsersRepository(props.postgres),
    hmacService: new HmacService({ salt: CONFIG.salts.hashCredentials }),
    hashPasswordService: new HashPasswordService(),
    encryptionService: new EncryptionService(),
  });
};
