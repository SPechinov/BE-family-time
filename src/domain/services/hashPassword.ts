export interface IHashPasswordService {
  hashPassword(passwordPlain: string): string;
  verifyPassword(passwordPlain: string, passwordHashed: string): boolean;
}