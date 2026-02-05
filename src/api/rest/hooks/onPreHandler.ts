import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import { isDev } from '@/config';

export const onPreHandler = (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
  if (isDev()) {
    request.log.debug({ body: request.body, headers: request.headers });
  }
  done();
};
