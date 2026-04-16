import { FastifyInstance } from 'fastify';
import { DbTransactionService } from '@/pkg/dbTransaction';
import { GroupsRoutesController } from '@/api/rest/routes/groups';
import { GroupsUseCases } from '@/useCases';
import { IGroupsService, IGroupsUsersService, IUsersService } from '@/domains/services';
import { Pool } from 'pg';

export const registerGroupsRoutes = (props: {
  instance: FastifyInstance;
  postgres: Pool;
  usersService: IUsersService;
  groupsService: IGroupsService;
  groupsUsersService: IGroupsUsersService;
}) => {
  const groupsUseCases = new GroupsUseCases({
    groupsService: props.groupsService,
    usersService: props.usersService,
    groupsUsersService: props.groupsUsersService,
    transactionService: new DbTransactionService(props.postgres),
  });

  new GroupsRoutesController({
    fastify: props.instance,
    groupsUseCases,
  }).register();
};
