import { GroupId } from '@/entities';

export interface IGroupRowData {
  id: GroupId;
  name: string;
  description: string | null;
  created_at: Date;
}
