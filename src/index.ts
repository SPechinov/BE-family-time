import { CONFIG, isDev } from '@/config';
import { Logger, newPostgresConnection, newRedisConnection } from '@/pkg';
import { newApiRest } from '@/api/rest';
import { LoggerOptions } from 'pino';

const loggerConfig = ((): LoggerOptions => {
  if (isDev()) {
    return {
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    };
  }

  return {
    level: 'info',
  };
})();

const run = async () => {
  const logger = new Logger(loggerConfig);

  logger.info(`Environment: ${CONFIG.nodeEnv.toUpperCase()}`);

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
    logger.info('Redis disconnected');

    postgres.end();
    logger.info('PostgreSQL disconnected');

    logger.info('Server stopping...');
    setTimeout(() => {
      process.exit(0);
    }, 100);
  };

  process.on('SIGINT', destroyApp);
  process.on('SIGTERM', destroyApp);
};

run().catch((error) => {
  console.error('Critical error during startup:', error);
  process.exit(1);
});
