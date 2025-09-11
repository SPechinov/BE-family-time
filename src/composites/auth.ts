import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { RedisClient } from '@/pkg';
import { UserRepository } from '@/repositories/db';
import { AuthRegistrationStore } from '@/repositories/stores';
import { AuthUseCases } from '@/useCases/auth';
import { AuthRoutesController } from '@/api/rest';
import { CryptoService, HashService } from '@/services';

export class CompositeAuth {
  constructor(props: { fastify: FastifyInstance; pool: Pool; redis: RedisClient }) {
    const userRepository = new UserRepository({ pool: props.pool });
    const authRegistrationStore = new AuthRegistrationStore({ redis: props.redis });
    const hashService = new HashService();
    const cryptoService = new CryptoService();
    const authUseCases = new AuthUseCases({ userRepository, authRegistrationStore, hashService, cryptoService });

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
