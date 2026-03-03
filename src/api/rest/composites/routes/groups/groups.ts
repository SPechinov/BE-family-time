import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { GroupsRoutesController } from '../../../routes/groups';
import { createGroupsDependencies } from './utils';

export class GroupsComposite {
  #fastifyInstance: FastifyInstance;
  #postgres: Pool;

  constructor(props: { fastifyInstance: FastifyInstance; postgres: Pool }) {
    this.#fastifyInstance = props.fastifyInstance;
    this.#postgres = props.postgres;

    this.#register();
  }

  #register() {
    const { groupsUseCases } = createGroupsDependencies({ postgres: this.#postgres });

    new GroupsRoutesController({
      fastify: this.#fastifyInstance,
      groupsUseCases: groupsUseCases,
    }).register();
  }
}
