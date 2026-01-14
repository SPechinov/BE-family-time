import { CONFIG } from '@/config';
import { newPostgresConnection, newRedisConnection } from '@/pkg';

const run = async () => {
  const [redis, postgres] = await Promise.all([newRedisConnection(CONFIG.redis), newPostgresConnection(CONFIG.postgres)]);

  const destroyApp = async () => {
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
