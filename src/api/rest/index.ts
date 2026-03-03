import { ILogger, newFastify, RedisClient } from '@/pkg';
import { isDev } from '@/config';
import { Pool } from 'pg';
import { globalErrorHandler, authenticate } from './utils';
import { AuthComposite, GroupsComposite, MeComposite, CalendarEventsComposite } from './composites';

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

  fastify.decorate('authenticate', authenticate);

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
