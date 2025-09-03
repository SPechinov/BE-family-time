import { FastifyInstance } from 'fastify';
import { AuthRoutesController } from '../api/rest';

export class CompositeAuth {
  constructor(props: { fastify: FastifyInstance }) {
    props.fastify.register(
      (instance) => {
        new AuthRoutesController({ fastify: instance });
      },
      { prefix: '/auth' },
    );
  }
}
