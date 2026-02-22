import { Pool } from 'pg';
import { MeUseCases } from '@/useCases';
import { IUsersService, IJwtService } from '@/domains/services';
import { JwtService } from '@/services/jwt';
import { IAuthMiddleware } from '../../../domains';
import { createUsersService } from '../../utils';
import { AuthMiddleware } from '../../../middlewares';

export interface MeDependencies {
  jwtService: IJwtService;
  authMiddleware: IAuthMiddleware;
  usersService: IUsersService;
  meUseCases: MeUseCases;
}

interface CreateMeDependenciesProps {
  postgres: Pool;
}

export const createMeDependencies = (props: CreateMeDependenciesProps): MeDependencies => {
  const { postgres } = props;

  const jwtService = new JwtService();
  const usersService = createUsersService(postgres);
  const authMiddleware = new AuthMiddleware({ jwtService });

  const meUseCases = new MeUseCases({
    usersService,
  });

  return {
    jwtService,
    authMiddleware,
    usersService,
    meUseCases,
  };
};
