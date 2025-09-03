import { FastifyInstance, RegisterOptions } from 'fastify';

export class RoutesController {
  constructor(props: { fastify: FastifyInstance }) {
    props.fastify.register((instance: FastifyInstance, options: RegisterOptions) => {
      instance.get('/', (request, reply) => {
        reply.send()
      })
    }, { prefix: '/api' });
  }
}
