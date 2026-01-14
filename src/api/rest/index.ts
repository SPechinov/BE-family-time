import { newFastify, RedisClient, registerOpenApi } from '@/pkg';
import { CONFIG } from '@/config';
import { Pool } from 'pg';

type Props = {
  redis: RedisClient;
  postgres: Pool
}

export const newApiRest = (props: Props) => {
  const fastify = newFastify({
    errorHandler: () => {},
  });
  registerOpenApi(fastify);

  fastify.listen({ port: CONFIG.server.port }, (error, address) => {
    if (error) throw error;
    console.log(`Сервер запущен по адресу: ${address}`);
  });

  return fastify;
}