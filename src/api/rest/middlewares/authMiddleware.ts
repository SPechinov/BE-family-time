import { FastifyRequest } from 'fastify';
import { ErrorUnauthorized, ErrorTokenExpired } from '@/pkg';
import { IJwtService } from '@/domains/services';
import { IAuthMiddleware } from '@/api/rest/domains';

export class AuthMiddleware implements IAuthMiddleware {
  #jwtService: IJwtService;

  constructor(props: { jwtService: IJwtService }) {
    this.#jwtService = props.jwtService;
  }

  authenticate = async (request: FastifyRequest) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) throw new ErrorUnauthorized();

    const token = authHeader.substring(7);
    const decoded = this.#jwtService.verifyAccessToken(token);

    if (!decoded) throw new ErrorTokenExpired();

    (request as any).userId = decoded.userId;
  };
}
