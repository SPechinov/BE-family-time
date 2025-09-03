import { FastifyInstance } from 'fastify';
import { REGISTRATION_BEGIN_SCHEMA } from './schemas';

export class AuthRoutesController {
  #fastify: FastifyInstance;

  constructor(props: { fastify: FastifyInstance }) {
    this.#fastify = props.fastify;
    this.#register();
  }

  #register() {
    this.#fastify.post(
      '/registration-begin',
      { schema: { body: REGISTRATION_BEGIN_SCHEMA } },
      async (request, reply) => {
        return { hello: 'world' };
      },
    );
  }
}
