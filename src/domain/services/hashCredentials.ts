export interface IHashCredentialsService {
  hashEmail(email: string): string;

  hashPhone(phone: string): string;
}
