import { UUID } from 'node:crypto';

export interface IGroupRowData {
  id: UUID;
  name: string;
  description: string | null;
  created_at: Date;
}
