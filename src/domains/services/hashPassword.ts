export interface IHashPasswordService {
  hashPassword(passwordPlain: string): Promise<string>;
  verifyPassword(passwordPlain: string, passwordHashed: string): Promise<boolean>;
}
