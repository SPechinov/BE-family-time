import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import {
  ErrorInvalidCode,
  ErrorInvalidContacts,
  ErrorInvalidLoginOrPassword,
  ErrorInvalidRefreshToken,
  ErrorTokenExpired,
  ErrorTooManyRequests,
  ErrorUnauthorized,
  ErrorUserExists,
} from '@/pkg';

export const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  const params: Record<string, any> = {
    statusCode: 500,
    originalUrl: request.originalUrl,
    timestamp: Date.now(),
  };

  const businessError = getBusinessError(error);
  if (businessError) {
    params.statusCode = businessError.statusCode;
    params.code = error.message;
    request.log.debug(error.message);
  } else if (hasZodFastifySchemaValidationErrors(error)) {
    params.statusCode = 422;
    params.message = error.message;
    request.log.error(error.message);
  } else {
    request.log.error(error);
  }

  reply.code(params.statusCode).send(params);
};

const BUSINESS_ERRORS = new Map([
  [ErrorInvalidCode.name, { statusCode: 400 }],
  [ErrorUserExists.name, { statusCode: 400 }],
  [ErrorInvalidContacts.name, { statusCode: 400 }],
  [ErrorTooManyRequests.name, { statusCode: 429 }],
  [ErrorInvalidLoginOrPassword.name, { statusCode: 400 }],
  [ErrorInvalidRefreshToken.name, { statusCode: 400 }],
  [ErrorUnauthorized.name, { statusCode: 401 }],
  [ErrorTokenExpired.name, { statusCode: 401 }],
]);

const getBusinessError = (error: FastifyError) => {
  const errorConfig = BUSINESS_ERRORS.get(error.constructor.name);
  return errorConfig || null;
};
