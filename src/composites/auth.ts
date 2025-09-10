import { FastifyInstance } from 'fastify';
import { AuthRoutesController } from '../api/rest';
import { AuthUseCases } from '../useCases/auth';
import { UserRepository } from '../repositories/db';
import { Pool } from 'pg';
import { RedisClient } from '../pkg';
import { AuthRegistrationStore } from '../repositories/stores';

export class CompositeAuth {
  constructor(props: { fastify: FastifyInstance; pool: Pool; redis: RedisClient }) {
    const userRepository = new UserRepository({ pool: props.pool });
    const authRegistrationStore = new AuthRegistrationStore({ redis: props.redis });
    const authUseCases = new AuthUseCases({ userRepository, authRegistrationStore });

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
