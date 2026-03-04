import { ILogger, newFastify, RedisClient } from '@/pkg';
import { isDev } from '@/config';
import { Pool } from 'pg';
import { globalErrorHandler, authenticate } from './utils';
import { AuthComposite, GroupsComposite, MeComposite, CalendarEventsComposite } from './composites';
import { TokensService } from '@/api/rest/services';
import { FastifyRequest } from 'fastify';

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

  const tokensService = new TokensService({ fastify, redis: props.redis });

  fastify.decorate('authenticate', (request: FastifyRequest) => {
    return authenticate(request, { tokensService });
  });

  fastify.register(
    (instance) => {
      new AuthComposite({ fastifyInstance: instance, redis: props.redis, postgres: props.postgres, tokensService });
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
