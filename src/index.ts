import { CONFIG } from './config';
import { newRedis } from './pkg/redis';
import { newPg } from './pkg/pg';

console.log(CONFIG);

const run = async () => {
  const [redis, pg] = await Promise.all([newRedis(CONFIG.redis), newPg(CONFIG.postgres)]);
  console.log(redis, pg);
};

run();
