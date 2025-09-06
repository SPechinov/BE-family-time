import { CONFIG } from './config';
import { newPg, newRedis, newFastify } from './pkg';
import { CompositeAuth } from './composites';
import { errorHandler } from './api/rest/pkg';

console.log(CONFIG);

const run = async () => {
  const [redis, pg] = await Promise.all([newRedis(CONFIG.redis), newPg(CONFIG.postgres)]);
  const fastify = newFastify({ errorHandler });

  fastify.register(
    (instance) => {
      new CompositeAuth({ fastify: instance });
    },
    { prefix: '/api' },
  );

  fastify.listen({ port: CONFIG.server.port }, (error, address) => {
    if (error) throw error;
    console.log(`Server listening at ${address}`);
  });
};

run();
