import { FastifyInstance } from 'fastify';

export class AuthRoutesController {
  #fastify: FastifyInstance;

  constructor(props: { fastify: FastifyInstance }) {
    this.#fastify = props.fastify;
    this.#register();
  }

  #register() {
    this.#fastify.get('/login', async (request, reply) => {
      return { hello: 'world' };
    });
  }
}
