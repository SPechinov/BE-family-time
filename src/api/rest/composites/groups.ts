import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { GroupsRoutesController } from '@/api/rest/routes/groups';
import { createGroupsDependencies } from './dependencies';

export class GroupsComposite {
  #fastifyInstance: FastifyInstance;
  #postgres: Pool;

  constructor(props: { fastifyInstance: FastifyInstance; postgres: Pool }) {
    this.#fastifyInstance = props.fastifyInstance;
    this.#postgres = props.postgres;

    this.#register();
  }

  #register() {
    const dependencies = createGroupsDependencies({ postgres: this.#postgres });

    new GroupsRoutesController({
      fastify: this.#fastifyInstance,
      authMiddleware: dependencies.authMiddleware,
    }).register();
  }
}
