import { AuthMiddleware } from '@/api/rest/middlewares';
import { IJwtService } from '@/domains/services';

export const createAuthMiddleware = (jwtService: IJwtService) => {
  return new AuthMiddleware({ jwtService });
};
