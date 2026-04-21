import { IGroupsService, IGroupsUsersService, IUsersService } from '@/domains/services';
import { IDbTransactionService } from '@/pkg/dbTransaction';

export interface GroupsUseCasesDeps {
  usersService: IUsersService;
  groupsService: IGroupsService;
  groupsUsersService: IGroupsUsersService;
  transactionService: IDbTransactionService;
}
