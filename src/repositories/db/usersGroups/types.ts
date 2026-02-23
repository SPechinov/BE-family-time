import { UUID } from 'node:crypto';

export interface IUsersGroupsRowData {
  user_id: UUID;
  group_id: UUID;
  is_owner: boolean;
  created_at: Date;
  deleted: boolean;
}
