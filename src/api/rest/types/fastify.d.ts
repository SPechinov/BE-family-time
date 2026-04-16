import 'fastify';
import { UserId } from '@/entities';

declare module 'fastify' {
  interface FastifyRequest {
    userId: UserId;
    userAgent: string;
    startRequestTimestamp: number;
  }

  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}
