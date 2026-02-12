export interface IEncryptionService {
  encrypt(value: string, salt: string): Promise<string>;
  decrypt(value: string, salt: string): Promise<string>;
}
