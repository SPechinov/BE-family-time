import { GroupsService } from '@/services';
import { GroupsRepository } from '@/repositories/db';
import { Pool } from 'pg';

export const createGroupsService = (props: { postgres: Pool }) => {
  return new GroupsService({ groupsRepository: new GroupsRepository(props.postgres) });
};
