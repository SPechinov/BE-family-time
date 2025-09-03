import Fastify from 'fastify';

export const newFastify = () => {
  return Fastify({
    logger: {
      base: null,
    },
    genReqId: (() => {
      let i = 0;
      return () => `${Date.now()}${i++}`;
    })(),
  });
};
