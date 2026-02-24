import { Pool } from 'pg';
import { JwtService } from '@/services/jwt';
import { AuthMiddleware } from '@/api/rest/middlewares';
import { GroupsRepository, UsersGroupsRepository } from '@/repositories/db';
import { GroupsService, UsersGroupsService } from '@/services';
import { GroupsUseCases } from '@/useCases';
import { createUsersService } from '@/api/rest/composites/utils';

interface CreateGroupsDependenciesProps {
  postgres: Pool;
}

export const createGroupsDependencies = (props: CreateGroupsDependenciesProps) => {
  const jwtService = new JwtService();
  const authMiddleware = new AuthMiddleware({ jwtService });
  const groupsRepository = new GroupsRepository(props.postgres);
  const usersGroupsRepository = new UsersGroupsRepository(props.postgres);

  const usersService = createUsersService(props.postgres);
  const groupsService = new GroupsService({ groupsRepository });
  const usersGroupsService = new UsersGroupsService({ usersGroupsRepository });

  const groupsUseCases = new GroupsUseCases({ groupsService, usersGroupsService, usersService });

  return {
    jwtService,
    authMiddleware,
    groupsUseCases,
  };
};
