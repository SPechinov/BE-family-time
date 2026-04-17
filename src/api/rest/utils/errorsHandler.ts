import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { BusinessError, ErrorUserNotExists } from '@/pkg';
import { ApiErrorPayload } from './response';
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export const globalErrorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  const shouldHideUserNotExistsAsOk = Boolean(request.routeOptions.config.hideUserNotExistsAsOk);
  if (error instanceof ErrorUserNotExists && shouldHideUserNotExistsAsOk) {
    request.log.debug(error.message);
    reply.code(200).send({});
    return;
  }

  const params: ApiErrorPayload = {
    statusCode: 500,
    originalUrl: request.originalUrl,
    timestamp: Date.now(),
  };

  if (error instanceof BusinessError) {
    params.statusCode = error.statusCode;
    params.code = error.message;
    request.log.debug(error.message);
  } else if (hasZodFastifySchemaValidationErrors(error)) {
    params.statusCode = 422;
    params.message = error.message;
    request.log.error(error.message);
  } else if (error.code === 'FST_ERR_CTP_EMPTY_JSON_BODY') {
    params.statusCode = 422;
    params.message = error.message;
    request.log.error(error.message);
  } else {
    request.log.error(error);
  }

  reply.code(params.statusCode).send(params);
};
