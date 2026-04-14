import { ILogger, newFastify, RedisClient } from '@/pkg';
import { CONFIG, isDev } from '@/config';
import { Pool } from 'pg';
import { globalErrorHandler, authenticate } from './utils';
import { AuthComposite, GroupsComposite, MeComposite, CalendarEventsComposite } from './composites';
import { FastifyRequest } from 'fastify';
import { TokensSessionsBlacklistStore } from '@/repositories/stores';

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
  const tokensSessionsBlacklistStore = new TokensSessionsBlacklistStore({
    redis: props.redis,
    sessionsIndexTtlSec: CONFIG.jwt.refresh.expiry / 1000,
  });

  fastify.decorate('authenticate', (request: FastifyRequest) => {
    return authenticate(request, { tokensSessionsBlacklistStore });
  });

  fastify.register(
    (instance) => {
      new AuthComposite({ fastifyInstance: instance, redis: props.redis, postgres: props.postgres });
      new MeComposite({ fastifyInstance: instance, postgres: props.postgres });
      new GroupsComposite({ fastifyInstance: instance, postgres: props.postgres });
      new CalendarEventsComposite({ fastifyInstance: instance, postgres: props.postgres });
    },
    { prefix: '/api' },
  );

  await fastify.ready();
  if (isDev()) {
    fastify.swagger();
  }

  return fastify;
};
