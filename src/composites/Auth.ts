import { FastifyInstance } from 'fastify';
import { AuthRoutesController } from '../api/rest';
import { AuthUseCases } from '../useCases/auth';
import { UserRepository } from '../repositories/db';
import { Pool } from 'pg';
import { AuthStore } from '../repositories/stores/Auth';

export class CompositeAuth {
  constructor(props: { fastify: FastifyInstance; pool: Pool }) {
    const userRepository = new UserRepository({ pool: props.pool });
    const authStore = new AuthStore();
    const authUseCases = new AuthUseCases({ userRepository, authStore });

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
