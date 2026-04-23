import { IDbTransactionService, IGroupsService, IGroupsUsersService, IUsersService } from '@/domains/services';

export interface GroupUseCasesDeps {
  usersService: IUsersService;
  groupsService: IGroupsService;
  groupsUsersService: IGroupsUsersService;
  transactionService: IDbTransactionService;
}
