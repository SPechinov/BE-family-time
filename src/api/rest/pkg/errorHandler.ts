import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { ErrorInvalidCode } from '@/pkg';

export const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  const params: Record<string, any> = {
    statusCode: 500,
    originalUrl: request.originalUrl,
    timestamp: Date.now(),
  };

  if (hasZodFastifySchemaValidationErrors(error)) {
    params.statusCode = 422;
    params.message = error.message;
    params.isValidationError = true;
    request.log.error(error.message);
  } else if (error instanceof ErrorInvalidCode) {
    params.statusCode = 400;
    params.message = error.message;
    request.log.debug(error.message);
  } else {
    request.log.error(error);
  }

  reply.code(params.statusCode).send(params);
};
