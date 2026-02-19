import { Pool } from 'pg';
import { IAuthMiddleware } from '@/api/rest/domains';
import { JwtService } from '@/services/jwt';
import { AuthMiddleware } from '@/api/rest/middlewares';
import { IJwtService } from '@/domains/services';

export interface GroupsDependencies {
  jwtService: IJwtService;
  authMiddleware: IAuthMiddleware;
}

interface CreateGroupsDependenciesProps {
  postgres: Pool;
}

export const createGroupsDependencies = (props: CreateGroupsDependenciesProps): GroupsDependencies => {
  const { postgres } = props;

  const jwtService = new JwtService();
  const authMiddleware = new AuthMiddleware({ jwtService });

  return {
    jwtService,
    authMiddleware,
  };
};
