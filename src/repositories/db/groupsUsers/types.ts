import { UUID } from 'node:crypto';

export interface IGroupsUsersRowData {
  user_id: UUID;
  group_id: UUID;
  is_owner: boolean;
  created_at: Date;
}
