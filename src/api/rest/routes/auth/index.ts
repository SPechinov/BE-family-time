import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AUTH_SCHEMAS } from './schemas';

const ROUTES = Object.freeze({
  registrationStart: '/registration-start',
});

export class AuthRoutesController {
  #fastify: FastifyInstance;

  constructor(props: { fastify: FastifyInstance }) {
    this.#fastify = props.fastify;
  }

  register() {
    const router = this.#fastify.withTypeProvider<ZodTypeProvider>();

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
