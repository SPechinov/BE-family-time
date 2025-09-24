import Fastify, { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import formBody from '@fastify/formbody';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import cookie from '@fastify/cookie';
import { CONFIG } from '@/config';

const customJsonSchemaTransform = (props: any) => {
  const transformed = jsonSchemaTransform(props);

  if (transformed.schema && transformed.schema.response) {
    const responses: Record<string, any> = transformed.schema.response;
    const errorCodes = Object.keys(responses);

    errorCodes.forEach((code) => {
      if (code.startsWith('4') || code.startsWith('5')) {
        delete responses[code];
      }
    });
  }

  return transformed;
};

export const newFastify = (props: {
  errorHandler: (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => void;
}) => {
  const fastify = Fastify({
    logger: {
      base: null,
      level: 'debug',
    },
    genReqId: (() => {
      let i = 0;
      return () => `${Date.now()}${i++}`;
    })(),
  });

  fastify.register(formBody);
  fastify.register(cookie, {
    secret: CONFIG.cookie.secret,
  });

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  fastify.addHook('onSend', (request, reply, payload, done) => {
    reply.header('X-Request-ID', request.id);
    done(null, payload);
  });

  fastify.setErrorHandler(props.errorHandler);

  fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Docs',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter JWT token',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    transform: customJsonSchemaTransform,
  });

  fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  return fastify;
};
