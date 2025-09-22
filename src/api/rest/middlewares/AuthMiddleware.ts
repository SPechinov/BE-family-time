import { FastifyRequest, FastifyReply } from 'fastify';
import { IJwtService } from '@/domain/services';
import { ErrorUnauthorized, ErrorTokenExpired } from '@/pkg';

export class AuthMiddleware {
  #jwtService: IJwtService;

  constructor(props: { jwtService: IJwtService }) {
    this.#jwtService = props.jwtService;
  }

  authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) throw new ErrorUnauthorized();

    const token = authHeader.substring(7);
    const decoded = this.#jwtService.verifyAccessToken(token);

    if (!decoded) throw new ErrorTokenExpired();

    (request as any).userId = decoded.userId;
  };
}