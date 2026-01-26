export interface ICryptoService {
  encrypt(value: string, salt: string): string;
  decrypt(value: string, salt: string): string;
}
