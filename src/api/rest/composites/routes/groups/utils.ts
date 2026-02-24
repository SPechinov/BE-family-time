import { Pool } from 'pg';
import { JwtService } from '@/services/jwt';
import { AuthMiddleware } from '@/api/rest/middlewares';
import { GroupsRepository, GroupsUsersRepository } from '@/repositories/db';
import { GroupsService, GroupsUsersService } from '@/services';
import { GroupsUseCases } from '@/useCases';
import { createUsersService } from '@/api/rest/composites/utils';

interface CreateGroupsDependenciesProps {
  postgres: Pool;
}

export const createGroupsDependencies = (props: CreateGroupsDependenciesProps) => {
  const jwtService = new JwtService();
  const authMiddleware = new AuthMiddleware({ jwtService });
  const groupsRepository = new GroupsRepository(props.postgres);
  const groupsUsersRepository = new GroupsUsersRepository(props.postgres);

  const usersService = createUsersService(props.postgres);
  const groupsService = new GroupsService({ groupsRepository });
  const groupsUsersService = new GroupsUsersService({ groupsUsersRepository });

  const groupsUseCases = new GroupsUseCases({
    groupsService,
    groupsUsersService,
    usersService,
    groupsRepository,
  });

  return {
    jwtService,
    authMiddleware,
    groupsUseCases,
  };
};
