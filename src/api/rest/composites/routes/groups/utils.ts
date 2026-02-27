import { Pool } from 'pg';

import { GroupsUseCases } from '@/useCases';

import { createUsersService, createGroupsUsersService } from '../../utils';
import { DbTransactionService } from '@/pkg/dbTransaction';
import { createGroupsService } from '@/api/rest/composites/utils/createGroupsService';

export const createGroupsDependencies = (props: { postgres: Pool }) => {
  return {
    groupsUseCases: new GroupsUseCases({
      groupsService: createGroupsService({ postgres: props.postgres }),
      usersService: createUsersService({ postgres: props.postgres }),
      groupsUsersService: createGroupsUsersService({ postgres: props.postgres }),
      transactionService: new DbTransactionService(props.postgres),
    }),
  };
};
