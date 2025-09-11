export interface IHashService {
  hashEmail(email: string): string;

  hashPhone(phone: string): string;
}
