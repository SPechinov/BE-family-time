import { CONFIG } from '@/config';
import { newFastify, newPostgresConnection, newRedisConnection, registerOpenApi } from '@/pkg';

const run = async () => {
  const [redis, postgres] = await Promise.all([
    newRedisConnection(CONFIG.redis),
    newPostgresConnection(CONFIG.postgres),
  ]);

  const fastify = newFastify({
    errorHandler: () => {},
  });
  registerOpenApi(fastify);

  fastify.listen({ port: CONFIG.server.port }, (error, address) => {
    if (error) throw error;
    console.log(`Сервер запущен по адресу: ${address}`);
  });

  const destroyApp = async () => {
    await fastify.close();
    console.log('\n');
    console.log('Сервер выключен');

    redis.destroy();
    console.log('Redis отключен');

    postgres.end();
    console.log('PostgreSQL отключен');

    process.exit(0);
  };

  process.on('SIGINT', destroyApp);
  process.on('SIGTERM', destroyApp);
};

run();
