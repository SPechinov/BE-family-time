import { FastifyRequest } from 'fastify';

export interface IAuthMiddleware {
  authenticate(request: FastifyRequest): Promise<void>;
}
