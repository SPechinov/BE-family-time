import Fastify, { DoneFuncWithErrOrRes, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import formBody from '@fastify/formbody';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import cookie, { FastifyCookieOptions } from '@fastify/cookie';
import { CONFIG } from '@/config';

const genReqId = (() => {
  let i = 0;
  return () => `${Date.now()}${i++}`;
})();

const handleSend = (request: FastifyRequest, reply: FastifyReply, payload: unknown, done: DoneFuncWithErrOrRes) => {
  reply.header('X-Request-ID', request.id);
  done(null, payload);
};

const COOKIE_CONFIG: FastifyCookieOptions = {
  secret: CONFIG.cookie.secret,
};

export const newFastify = (props: {
  errorHandler: (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => void;
}) => {
  const fastify = Fastify({
    logger: {
      base: null,
      level: 'error',
    },
    genReqId,
  });

  fastify.register(formBody);
  fastify.register(cookie, COOKIE_CONFIG);

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  fastify.addHook('onSend', handleSend);
  fastify.setErrorHandler(props.errorHandler);

  return fastify;
};
