import { FastifyInstance, RegisterOptions } from 'fastify';

export class RoutesController {
  constructor(props: { fastify: FastifyInstance }) {
    props.fastify.register((instance: FastifyInstance, options: RegisterOptions) => {}, { prefix: '/api' });
  }
}
