import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { GroupsRoutesController } from '../../../routes/groups';
import { IAuthMiddleware } from '../../../domains';
import { createCalendarEventsDependencies } from './utils';

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
  }
}
