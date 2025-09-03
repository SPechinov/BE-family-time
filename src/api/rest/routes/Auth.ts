import { FastifyInstance } from 'fastify';

export class AuthRoutesController {
  constructor(props: { fastify: FastifyInstance }) {
    this.#register(props.fastify);
  }

  #register(fastify: FastifyInstance) {
    fastify.get('/login', async () => {
      return { hello: 'world' };
    });
  }
}
