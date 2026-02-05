import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';

export const onPreHandler = (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
  request.log.debug({ body: request.body, headers: request.headers });
  done();
};
