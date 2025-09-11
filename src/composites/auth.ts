import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { RedisClient } from '@/pkg';
import { UserRepository } from '@/repositories/db';
import { AuthRegistrationStore } from '@/repositories/stores';
import { AuthUseCases } from '@/useCases/auth';
import { AuthRoutesController } from '@/api/rest';
import { CryptoCredentialsService, HashCredentialsService } from '@/services';

export class CompositeAuth {
  constructor(props: { fastify: FastifyInstance; pool: Pool; redis: RedisClient }) {
    const userRepository = new UserRepository({ pool: props.pool });
    const authRegistrationStore = new AuthRegistrationStore({ redis: props.redis });
    const hashCredentialsService = new HashCredentialsService();
    const cryptoCredentialsService = new CryptoCredentialsService();
    const authUseCases = new AuthUseCases({
      userRepository,
      authRegistrationStore,
      hashCredentialsService,
      cryptoCredentialsService,
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
