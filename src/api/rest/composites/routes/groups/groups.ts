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

    // Register groups routes first
    const groupsController = new GroupsRoutesController({
      fastify: this.#fastifyInstance,
      authMiddleware: dependencies.authMiddleware,
      groupsUseCases: dependencies.groupsUseCases,
    });
    groupsController.register();

    // Register calendar routes inside groups routes to inherit :groupId parameter
    // Calendar routes use prefix /groups/:groupId/calendar
    new CalendarRoutesController({
      fastify: this.#fastifyInstance,
      authMiddleware: dependencies.authMiddleware,
      calendarEventsUseCases: dependencies.calendarEventsUseCases,
    }).register();
  }
}
