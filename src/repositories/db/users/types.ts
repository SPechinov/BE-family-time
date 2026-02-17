export interface IUserRowData {
  id: string;
  encryption_salt: string;
  first_name_encrypted?: Buffer | null;
  last_name_encrypted?: Buffer | null;
  email_encrypted?: Buffer | null;
  phone_encrypted?: Buffer | null;
  email_hashed?: Buffer | null;
  phone_hashed?: Buffer | null;
  password_hashed?: Buffer | null;
  created_at: Date;
  updated_at: Date;
}
