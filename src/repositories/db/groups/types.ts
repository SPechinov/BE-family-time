import { UUID } from 'node:crypto';

export interface IGroupRowData {
  id: UUID;
  name: string;
  description: string | null;
  deleted: boolean;
  created_at: Date;
  deleted_at: Date | null;
}
