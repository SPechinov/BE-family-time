import { newFastify, RedisClient } from '@/pkg';
import { CONFIG } from '@/config';
import { Pool } from 'pg';
import { globalErrorHandler } from './utils';
import { AuthRoutesController } from './routes/auth';
import { AuthUseCases } from '@/useCases/auth';

interface Props {
  redis: RedisClient;
  postgres: Pool;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const newApiRest = async (props: Props) => {
  const fastify = newFastify({
    errorHandler: globalErrorHandler,
  });

  const authUseCases = new AuthUseCases();

  fastify.register(
    (instance) => {
      new AuthRoutesController({ fastify: instance, useCases: authUseCases }).register();
    },
    { prefix: '/api' },
  );

  fastify.listen({ port: CONFIG.server.port }, (error, address) => {
    if (error) throw error;
    console.log(`Сервер запущен по адресу: ${address}`);
  });

  await fastify.ready();
  fastify.swagger();

  return fastify;
};
