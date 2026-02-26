import { Pool } from 'pg';
import { JwtService } from '@/services/jwt';
import { AuthMiddleware } from '@/api/rest/middlewares';
import { GroupsRepository, GroupsUsersRepository, CalendarRepository } from '@/repositories/db';
import { GroupsService, GroupsUsersService, CalendarEventsService } from '@/services';
import { GroupsUseCases, CalendarEventsUseCases } from '@/useCases';
import { createUsersService } from '@/api/rest/composites/utils';
import { DbTransactionService } from '@/pkg/dbTransaction';

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
  const dbTransactionService = new DbTransactionService(props.postgres);

  const groupsUseCases = new GroupsUseCases({
    groupsService,
    groupsUsersService,
    usersService,
    transactionService: dbTransactionService,
  });

  const calendarEventsRepository = new CalendarRepository(props.postgres);
  const calendarEventsService = new CalendarEventsService({ calendarEventsRepository });
  const calendarEventsUseCases = new CalendarEventsUseCases({
    calendarEventsService,
    groupsUsersService,
  });

  return {
    jwtService,
    authMiddleware,
    groupsUseCases,
    calendarEventsUseCases,
  };
};
