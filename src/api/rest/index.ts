import { ILogger, newFastify, RedisClient } from '@/pkg';
import { CONFIG, isDev } from '@/config';
import { Pool } from 'pg';
import { globalErrorHandler } from './utils';
import { AuthComposite } from './composites';

interface Props {
  redis: RedisClient;
  postgres: Pool;
  logger: ILogger;
}

export const newApiRest = async (props: Props) => {
  const fastify = newFastify({
    errorHandler: globalErrorHandler,
    logger: props.logger,
  });

  fastify.register(
    (instance) => {
      new AuthComposite({ fastifyInstance: instance, redis: props.redis, postgres: props.postgres });
    },
    { prefix: '/api' },
  );

  fastify.listen({ port: CONFIG.server.port });

  await fastify.ready();
  if (isDev()) {
    fastify.swagger();
  }

  return fastify;
};
