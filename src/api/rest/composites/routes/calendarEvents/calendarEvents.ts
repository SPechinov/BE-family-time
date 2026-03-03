import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { createCalendarEventsDependencies } from './utils';
import { CalendarEventsRoutesController } from '../../../routes/calendarEvents';

export class CalendarEventsComposite {
  #fastifyInstance: FastifyInstance;
  #postgres: Pool;

  constructor(props: { fastifyInstance: FastifyInstance; postgres: Pool }) {
    this.#fastifyInstance = props.fastifyInstance;
    this.#postgres = props.postgres;

    this.#register();
  }

  #register() {
    const { calendarEventsUseCases } = createCalendarEventsDependencies({ postgres: this.#postgres });

    new CalendarEventsRoutesController({
      fastify: this.#fastifyInstance,
      calendarEventsUseCases,
    }).register();
  }
}
