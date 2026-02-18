import { Pool } from 'pg';
import { MeUseCase } from '@/useCases';
import { IUsersService, IJwtService } from '@/domains/services';
import { IAuthMiddleware } from '@/api/rest/domains';
import { createUsersService } from '../common/createUsersService';
import { createJwtService } from '../common/createJwtService';
import { createAuthMiddleware } from '../common/createAuthMiddleware';

export interface MeDependencies {
  jwtService: IJwtService;
  authMiddleware: IAuthMiddleware;
  usersService: IUsersService;
  meUseCases: MeUseCase;
}

interface CreateMeDependenciesProps {
  postgres: Pool;
}

export const createMeDependencies = (props: CreateMeDependenciesProps): MeDependencies => {
  const { postgres } = props;

  const jwtService = createJwtService();
  const usersService = createUsersService(postgres);
  const authMiddleware = createAuthMiddleware(jwtService);

  const meUseCases = new MeUseCase({
    usersService,
  });

  return {
    jwtService,
    authMiddleware,
    usersService,
    meUseCases,
  };
};
