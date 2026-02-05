import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';

export const onResponse = (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
  const duration = Date.now() - request.startRequestTimestamp;

  request.log.info({
    statusCode: reply.statusCode,
    duration: `${duration}ms`,
  });

  done();
};
