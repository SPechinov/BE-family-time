import { UserId, UserLanguageUnion } from '@/entities';

export interface IUserRowData {
  id: UserId;
  encryption_salt: string;
  first_name_encrypted?: Buffer | null;
  last_name_encrypted?: Buffer | null;
  date_of_birth_encrypted?: Buffer | null;
  email_encrypted?: Buffer | null;
  phone_encrypted?: Buffer | null;
  email_hashed?: Buffer | null;
  phone_hashed?: Buffer | null;
  password_hashed?: Buffer | null;
  time_zone: string;
  language: UserLanguageUnion;
  created_at: Date;
  updated_at: Date;
}
