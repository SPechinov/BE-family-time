import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { RedisClient } from '@/pkg';
import { UsersRepository } from '@/repositories/db';
import { AuthRegistrationStore } from '@/repositories/stores';
import { AuthUseCases } from '@/useCases/auth';
import { AuthRoutesController } from '@/api/rest';
import { CryptoService, HashPasswordService, HashService } from '@/services';
import { UsersService } from '@/services/users';

export class CompositeAuth {
  constructor(props: { fastify: FastifyInstance; pool: Pool; redis: RedisClient }) {
    const usersRepository = new UsersRepository({ pool: props.pool });
    const authRegistrationStore = new AuthRegistrationStore({ redis: props.redis });

    const hashPasswordService = new HashPasswordService();
    const hashService = new HashService();
    const cryptoService = new CryptoService();

    const usersService = new UsersService({
      hashService,
      cryptoService,
      hashPasswordService,
      usersRepository,
    });

    const authUseCases = new AuthUseCases({
      authRegistrationStore,
      usersService,
    });

    props.fastify.register(
      (instance) => {
        new AuthRoutesController({
          fastify: instance,
          authUseCases,
        });
      },
      { prefix: '/auth' },
    );
  }
}
