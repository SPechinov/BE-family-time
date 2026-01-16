import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AUTH_SCHEMAS } from './schemas';

const PREFIX = '/auth';

const ROUTES = Object.freeze({
  registrationStart: '/registration-start',
});

export class AuthRoutesController {
  #fastify: FastifyInstance;

  constructor(props: { fastify: FastifyInstance }) {
    this.#fastify = props.fastify;
  }

  register() {
    this.#fastify.register(
      (instance: FastifyInstance) => {
        const router = instance.withTypeProvider<ZodTypeProvider>();
        this.setRoutes(router);
      },
      { prefix: PREFIX },
    );
  }

  private setRoutes(router: FastifyInstance) {
    router.post(
      ROUTES.registrationStart,
      {
        schema: AUTH_SCHEMAS.registrationStart,
      },
      async (request, reply) => {
        reply.status(200).send();
      },
    );
  }
}
