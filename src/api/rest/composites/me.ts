import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { MeRoutesController } from '@/api/rest/routes/me';
import { createMeDependencies } from './dependencies';

export class MeComposite {
  #fastifyInstance: FastifyInstance;
  #postgres: Pool;

  constructor(props: { fastifyInstance: FastifyInstance; postgres: Pool }) {
    this.#fastifyInstance = props.fastifyInstance;
    this.#postgres = props.postgres;

    this.#register();
  }

  #register() {
    const dependencies = createMeDependencies({ postgres: this.#postgres });

    new MeRoutesController({
      fastify: this.#fastifyInstance,
      authMiddleware: dependencies.authMiddleware,
      meUseCases: dependencies.meUseCases,
    }).register();
  }
}
