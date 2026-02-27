import { GroupsUsersService } from '@/services';
import { GroupsUsersRepository } from '@/repositories/db';
import { Pool } from 'pg';

export const createGroupsUsersService = (props: { postgres: Pool }) => {
  return new GroupsUsersService({ groupsUsersRepository: new GroupsUsersRepository(props.postgres) });
};
