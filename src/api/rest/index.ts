import { ILogger, newFastify, RedisClient } from '@/pkg';
import { isDev } from '@/config';
import { Pool } from 'pg';
import { globalErrorHandler } from './utils';
import { registerRestApi } from './bootstrap';

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

  registerRestApi({ fastify, redis: props.redis, postgres: props.postgres });

  await fastify.ready();
  if (isDev()) {
    fastify.swagger();
  }

  return fastify;
};
