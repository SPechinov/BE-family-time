import { IDbTransactionService, IGroupsService, IGroupsUsersService, IUsersService } from '@/domains/services';

export interface GroupsUseCasesDeps {
  usersService: IUsersService;
  groupsService: IGroupsService;
  groupsUsersService: IGroupsUsersService;
  transactionService: IDbTransactionService;
}
