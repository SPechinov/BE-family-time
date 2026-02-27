import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { IAuthMiddleware } from '../../../domains';
import { createCalendarEventsDependencies } from './utils';
import { CalendarEventsRoutesController } from '../../../routes/calendarEvents/controller';

export class CalendarEventsComposite {
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
    const { calendarEventsUseCases } = createCalendarEventsDependencies({ postgres: this.#postgres });

    new CalendarEventsRoutesController({
      fastify: this.#fastifyInstance,
      authMiddleware: this.#authMiddleware,
      calendarEventsUseCases,
    }).register();
  }
}
