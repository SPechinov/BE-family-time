import { CONFIG } from './config';
import { newPg, newRedis } from './pkg';
import Fastify, { RawRequestDefaultExpression } from 'fastify';
import { RoutesController } from './api/rest/routes';

console.log(CONFIG);

const run = async () => {
  const [redis, pg] = await Promise.all([newRedis(CONFIG.redis), newPg(CONFIG.postgres)]);
  const fastify = Fastify({
    logger: {
      base: null,
    },
    genReqId: (() => {
      let i = 0;
      return () => `${Date.now()}${i++}`;
    })(),
  });

  new RoutesController({ fastify });
  fastify.addHook('onSend', (request, reply, payload, done) => {
    reply.header('X-Request-ID', request.id);
    done(null, payload);
  });

  fastify.listen({ port: CONFIG.server.port }, (error, address) => {
    if (error) throw error;
    console.log(`Server listening at ${address}`);
  });
};

run();
