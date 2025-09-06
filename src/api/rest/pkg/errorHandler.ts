import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from 'fastify-type-provider-zod';

export const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  const params: Record<string, any> = {
    originalUrl: request.originalUrl,
    timestamp: Date.now(),
  };

  if (hasZodFastifySchemaValidationErrors(error)) {
    params.statusCode = 422;
    params.message = error.message;
    params.isValidationError = true;
    request.log.error(error.message);
  }

  if (isResponseSerializationError(error)) {
    params.statusCode = 500;
    request.log.error(error);
  }
  reply.code(params.statusCode).send(params);
};
