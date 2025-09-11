export interface ICryptoCredentialsService {
  encryptEmail(email: string): string;
  decryptEmail(encryptedEmail: string): string;
  encryptPhone(phone: string): string;
  decryptPhone(encryptedPhone: string): string;
}