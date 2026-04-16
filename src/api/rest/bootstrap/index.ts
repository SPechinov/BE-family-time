import { FastifyInstance, FastifyRequest } from 'fastify';
import { Pool } from 'pg';
import { RedisClient } from '@/pkg';
import { authenticate } from '@/api/rest/utils';
import { ErrorInvalidUserAgent } from '@/pkg';
import { createAuthInfra, createCoreServices } from './shared';
import { registerAuthRoutes } from './auth';
import { registerMeRoutes } from './me';
import { registerGroupsRoutes } from './groups';
import { registerCalendarEventsRoutes } from './calendarEvents';

export const registerRestApi = (props: { fastify: FastifyInstance; redis: RedisClient; postgres: Pool }): void => {
  const core = createCoreServices(props.postgres);
  const authInfra = createAuthInfra(props.redis);

  props.fastify.decorate('authenticate', (request: FastifyRequest) => {
    return authenticate(request, { tokensSessionsBlacklistStore: authInfra.tokensSessionsBlacklistStore });
  });

  props.fastify.register(
    (instance) => {
      instance.addHook('onRequest', async (request) => {
        const userAgent = request.headers['user-agent'];
        if (typeof userAgent !== 'string') {
          request.log.warn('User agent not found');
          throw new ErrorInvalidUserAgent();
        }
        request.userAgent = userAgent;
      });

      registerAuthRoutes({
        instance,
        usersService: core.usersService,
        authInfra,
      });

      registerMeRoutes({
        instance,
        usersService: core.usersService,
      });

      registerGroupsRoutes({
        instance,
        postgres: props.postgres,
        usersService: core.usersService,
        groupsService: core.groupsService,
        groupsUsersService: core.groupsUsersService,
      });

      registerCalendarEventsRoutes({
        instance,
        usersService: core.usersService,
        groupsUsersService: core.groupsUsersService,
        calendarEventsService: core.calendarEventsService,
      });
    },
    { prefix: '/api' },
  );
};
