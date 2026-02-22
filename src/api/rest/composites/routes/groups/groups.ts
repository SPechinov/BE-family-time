import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { GroupsRoutesController } from '../../../routes/groups';
import { createGroupsDependencies } from './utils';
import { GroupsUseCases } from '@/useCases';
import { GroupsRepository } from '@/repositories/db';
import { GroupsService } from '@/services';

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
    const groupsRepository = new GroupsRepository({ pool: this.#postgres });
    const groupsService = new GroupsService({ groupsRepository });
    const groupsUseCases = new GroupsUseCases({ groupsService });

    new GroupsRoutesController({
      fastify: this.#fastifyInstance,
      authMiddleware: dependencies.authMiddleware,
      groupsUseCases,
    }).register();
  }
}
