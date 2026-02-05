import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';

export const onRequest = (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
  request.log.info(
    {
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
    },
    'incoming request',
  );
  request.startRequestTimestamp = Date.now();
  done();
};
