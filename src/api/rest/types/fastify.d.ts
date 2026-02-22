import 'fastify';
import { UUID } from 'node:crypto';

declare module 'fastify' {
  interface FastifyRequest {
    userId: UUID;
    startRequestTimestamp: number;
  }
}
