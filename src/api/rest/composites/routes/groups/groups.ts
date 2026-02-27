import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { GroupsRoutesController } from '../../../routes/groups';
import { createGroupsDependencies } from './utils';
import { IAuthMiddleware } from '@/api/rest/domains';

export class GroupsComposite {
  #fastifyInstance: FastifyInstance;
  #postgres: Pool;
  #authMiddleware: IAuthMiddleware;

  constructor(props: { fastifyInstance: FastifyInstance; postgres: Pool; authMiddleware: IAuthMiddleware }) {
    this.#fastifyInstance = props.fastifyInstance;
    this.#postgres = props.postgres;
    this.#authMiddleware = props.authMiddleware;

    this.#register();
  }

  #register() {
    const { groupsUseCases } = createGroupsDependencies({ postgres: this.#postgres });

    new GroupsRoutesController({
      fastify: this.#fastifyInstance,
      authMiddleware: this.#authMiddleware,
      groupsUseCases: groupsUseCases,
    }).register();
  }
}
