import { GroupId, UserId } from '@/entities';

export interface IGroupsUsersRowData {
  user_id: UserId;
  group_id: GroupId;
  is_owner: boolean;
  created_at: Date;
}
