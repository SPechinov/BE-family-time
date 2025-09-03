import { CONFIG } from './config';
import { newPg, newRedis } from './pkg';
import Fastify from 'fastify';
import { CompositeAuth } from './composites';

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

  fastify.decorate('redis', redis);
  fastify.decorate('pg', pg);

  fastify.addHook('onSend', (request, reply, payload, done) => {
    reply.header('X-Request-ID', request.id);
    done(null, payload);
  });

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
