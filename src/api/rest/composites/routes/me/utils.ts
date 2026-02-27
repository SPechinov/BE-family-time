import { Pool } from 'pg';
import { MeUseCases } from '@/useCases';
import { createUsersService } from '../../utils';

interface CreateMeDependenciesProps {
  postgres: Pool;
}

export const createMeDependencies = ({ postgres }: CreateMeDependenciesProps) => {
  const usersService = createUsersService({ postgres });

  const meUseCases = new MeUseCases({
    usersService,
  });

  return {
    usersService,
    meUseCases,
  };
};
