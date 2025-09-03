import { CONFIG } from './config';
import { newPg, newRedis } from './pkg';
import Fastify from 'fastify';
import { RoutesController } from './api/rest/routes';

console.log(CONFIG);

const run = async () => {
  const [redis, pg] = await Promise.all([newRedis(CONFIG.redis), newPg(CONFIG.postgres)]);
  const fastify = Fastify({
    logger: true,
  });

  new RoutesController({ fastify });

  fastify.listen({ port: CONFIG.server.port }, (error, address) => {
    if (error) throw error;
    console.log(`Server listening at ${address}`);
  });
};

run();
