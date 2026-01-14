import fastifySwagger, { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { FastifyInstance } from 'fastify';
import fastifySwaggerUi from '@fastify/swagger-ui';

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
  security: [{ bearerAuth: [] }],
};

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

export const registerOpenApi = (fastify: FastifyInstance) => {
  fastify.register(fastifySwagger, {
    openapi: OPEN_API_CONFIG,
    transform: customJsonSchemaTransform,
  });

  fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });
};
