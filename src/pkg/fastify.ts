import Fastify, { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import formBody from '@fastify/formbody';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { errorHandler } from '../api/rest/pkg';

export const newFastify = (props: {
  errorHandler: (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => void;
}) => {
  const fastify = Fastify({
    logger: {
      base: null,
    },
    genReqId: (() => {
      let i = 0;
      return () => `${Date.now()}${i++}`;
    })(),
  });

  fastify.register(formBody);

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  fastify.addHook('onSend', (request, reply, payload, done) => {
    reply.header('X-Request-ID', request.id);
    done(null, payload);
  });

  fastify.setErrorHandler(errorHandler);

  fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Docs',
        version: '1.0.0',
      },
    },
    transform: jsonSchemaTransform,
  });

  fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  return fastify;
};
