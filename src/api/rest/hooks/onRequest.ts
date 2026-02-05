import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';

export const onRequest = (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
  request.log.info({ url: request.url }, 'incoming request');
  request.startRequestTimestamp = Date.now();
  done();
};
