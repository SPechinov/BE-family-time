import { DoneFuncWithErrOrRes, FastifyReply, FastifyRequest } from 'fastify';

export const onSend = (request: FastifyRequest, reply: FastifyReply, payload: unknown, done: DoneFuncWithErrOrRes) => {
  reply.header('X-Request-ID', request.id);
  done(null, payload);
};
