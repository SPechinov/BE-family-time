import { FastifyInstance, RegisterOptions } from 'fastify';

export class RoutesController {
  constructor(props: { fastify: FastifyInstance }) {
    props.fastify.register((instance: FastifyInstance, options: RegisterOptions) => {
      instance.post('/auth/login', (request, reply) => {
        reply.send()
      })
    }, { prefix: '/api' });
  }
}
