import { FastifyInstance } from 'fastify';
import { DbTransactionService } from '@/pkg/dbTransaction';
import { GroupsRoutesController } from '@/api/rest/routes/groups';
import {
  CreateUserGroupUseCase,
  DeleteUserGroupUseCase,
  ExcludeUserFromGroupUseCase,
  GetUserGroupUseCase,
  InviteUserInGroupUseCase,
  ListUserGroupsUseCase,
  PatchUserGroupUseCase,
} from '@/useCases';
import { IGroupsService, IGroupsUsersService, IUsersService } from '@/domains/services';
import { Pool } from 'pg';

type GroupsRouteDeps = {
  instance: FastifyInstance;
  postgres: Pool;
  usersService: IUsersService;
  groupsService: IGroupsService;
  groupsUsersService: IGroupsUsersService;
};

const buildGroupsUseCases = (props: GroupsRouteDeps) => {
  const deps = {
    groupsService: props.groupsService,
    usersService: props.usersService,
    groupsUsersService: props.groupsUsersService,
    transactionService: new DbTransactionService(props.postgres),
  };

  const listUserGroupsUseCase = new ListUserGroupsUseCase({
    usersService: deps.usersService,
    groupsService: deps.groupsService,
    groupsUsersService: deps.groupsUsersService,
  });
  const createUserGroupUseCase = new CreateUserGroupUseCase(deps);
  const getUserGroupUseCase = new GetUserGroupUseCase({
    usersService: deps.usersService,
    groupsUsersService: deps.groupsUsersService,
    groupsService: deps.groupsService,
  });
  const patchUserGroupUseCase = new PatchUserGroupUseCase({
    usersService: deps.usersService,
    groupsUsersService: deps.groupsUsersService,
    groupsService: deps.groupsService,
  });
  const inviteUserInGroupUseCase = new InviteUserInGroupUseCase(deps);
  const excludeUserFromGroupUseCase = new ExcludeUserFromGroupUseCase({
    usersService: deps.usersService,
    groupsUsersService: deps.groupsUsersService,
  });
  const deleteUserGroupUseCase = new DeleteUserGroupUseCase(deps);

  return {
    listUserGroupsUseCase,
    createUserGroupUseCase,
    getUserGroupUseCase,
    patchUserGroupUseCase,
    inviteUserInGroupUseCase,
    excludeUserFromGroupUseCase,
    deleteUserGroupUseCase,
  };
};

export const registerGroupsRoutes = (props: GroupsRouteDeps) => {
  const useCases = buildGroupsUseCases(props);

  new GroupsRoutesController({
    fastify: props.instance,
    ...useCases,
  }).register();
};
