import { FastifyInstance } from 'fastify';
import { SCHEMA_REGISTRATION_BEGIN } from './schemas';

export class AuthRoutesController {
  #fastify: FastifyInstance;

  constructor(props: { fastify: FastifyInstance }) {
    this.#fastify = props.fastify;
    this.#register();
  }

  #register() {
    this.#fastify.post('/registration-begin', { schema: SCHEMA_REGISTRATION_BEGIN }, async (request, reply) => {
      return { hello: 'world' };
    });
  }
}
