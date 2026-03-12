import Fastify, { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import formBody from '@fastify/formbody';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import fastifySwagger, { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import cookie from '@fastify/cookie';
import { isDev } from '@/config';
import { ILogger } from '@/pkg/logger';
import { onPreHandler, onRequest, onResponse, onSend } from '@/api/rest/hooks';
import { nanoid } from 'nanoid';
import { wrappedJsonSchemaTransform, wrappedJsonSchemaTransformObject } from '@/pkg/fastify/utils';
import { CookieConfig, JwtConfig } from '@/pkg/fastify/constants';

const OPEN_API_CONFIG: FastifyDynamicSwaggerOptions['openapi'] = {
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
};

export const newFastify = (props: {
  errorHandler: (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => void;
  logger: ILogger;
}) => {
  const fastify = Fastify({
    loggerInstance: props.logger,
    disableRequestLogging: true,
    genReqId: () => nanoid(),
  });

  fastify.register(formBody);
  fastify.register(cookie, CookieConfig);

  if (isDev()) {
    fastify.register(cors, {
      origin: (_, cb) => cb(null, true),
      methods: '*',
      allowedHeaders: ['Authorization'],
      exposedHeaders: ['X-Request-ID', 'Authorization'],
      credentials: true,
    });
  }

  fastify.register(fastifyJwt, JwtConfig);

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  fastify.addHook('onRequest', onRequest);
  fastify.addHook('preHandler', onPreHandler);
  fastify.addHook('onResponse', onResponse);
  fastify.addHook('onSend', onSend);

  fastify.setErrorHandler(props.errorHandler);

  if (isDev()) {
    fastify.register(fastifySwagger, {
      openapi: OPEN_API_CONFIG,
      transform: wrappedJsonSchemaTransform,
      transformObject: wrappedJsonSchemaTransformObject,
    });

    fastify.register(fastifySwaggerUi, {
      routePrefix: '/doc',
    });
  }

  return fastify;
};
