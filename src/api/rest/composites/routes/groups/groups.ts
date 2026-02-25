import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { GroupsRoutesController } from '../../../routes/groups';
import { CalendarRoutesController } from '../../../routes/groups/calendar';
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
    const dependencies = createGroupsDependencies({ postgres: this.#postgres });

    new GroupsRoutesController({
      fastify: this.#fastifyInstance,
      authMiddleware: dependencies.authMiddleware,
      groupsUseCases: dependencies.groupsUseCases,
    }).register();

    new CalendarRoutesController({
      fastify: this.#fastifyInstance,
      authMiddleware: dependencies.authMiddleware,
      calendarEventsUseCases: dependencies.calendarEventsUseCases,
    }).register();
  }
}
