import 'fastify';
import { UserId } from '@/entities';

declare module 'fastify' {
  interface FastifyRequest {
    userId: UserId;
    startRequestTimestamp: number;
  }
}
