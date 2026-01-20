export interface ICryptoService {
  encrypt(value: string): string;
  decrypt(value: string): string;
}
