export interface IHashPasswordService {
  hashPassword(plainPassword: string): string;
  verifyPassword(plainPassword: string, hashedPassword: string): boolean;
}