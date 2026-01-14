export interface IUserRowData {
  id: string;
  first_name: string;
  last_name?: string | null;
  email_encrypted?: Buffer | null;
  phone_encrypted?: Buffer | null;
  email_hashed?: Buffer | null;
  phone_hashed?: Buffer | null;
  password_hashed?: Buffer | null;
  created_at: Date;
  updated_at: Date;
}
