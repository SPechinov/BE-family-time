import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export const globalErrorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  reply.status(200).send();
};
