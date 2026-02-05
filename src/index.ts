import { CONFIG } from '@/config';
import { Logger, newPostgresConnection, newRedisConnection } from '@/pkg';
import { newApiRest } from '@/api/rest';

const run = async () => {
  const logger = new Logger({
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  });

  const [redis, postgres] = await Promise.all([
    newRedisConnection({
      uri: CONFIG.redis.uri,
      onError: (error) => {
        logger.warn({ error }, 'Redis error');
      },
      onReady: () => {
        logger.info('Redis connected');
      },
    }),
    newPostgresConnection({
      uri: CONFIG.postgres.uri,
      onError: (error) => {
        logger.warn({ error }, 'PostgreSQL error');
      },
      onReady: () => {
        logger.info('PostgreSQL connected');
      },
    }),
  ]);

  const apiRest = await newApiRest({
    redis,
    postgres,
    logger,
  });

  const destroyApp = async () => {
    await apiRest.close();
    logger.info('API сервер выключен');

    redis.destroy();
    logger.info('Redis отключен');

    postgres.end();
    logger.info('PostgreSQL отключен');

    process.exit(0);
  };

  process.on('SIGINT', destroyApp);
  process.on('SIGTERM', destroyApp);
};

run();
