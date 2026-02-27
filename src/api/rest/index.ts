import { ILogger, newFastify, RedisClient } from '@/pkg';
import { isDev } from '@/config';
import { Pool } from 'pg';
import { globalErrorHandler } from './utils';
import { AuthComposite, GroupsComposite, MeComposite } from './composites';
import { AuthMiddleware } from '@/api/rest/middlewares';
import { JwtService } from '@/services';

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
      const jwtService = new JwtService();
      const authMiddleware = new AuthMiddleware({ jwtService });

      new AuthComposite({ fastifyInstance: instance, redis: props.redis, postgres: props.postgres, authMiddleware });
      new MeComposite({ fastifyInstance: instance, postgres: props.postgres, authMiddleware });
      new GroupsComposite({ fastifyInstance: instance, postgres: props.postgres, authMiddleware });
    },
    { prefix: '/api' },
  );

  await fastify.ready();
  if (isDev()) {
    fastify.swagger();
  }

  return fastify;
};
