import { UserId } from '@/entities';

export interface ITokensSessionsGenerator {
  generateTokens(props: { userId: UserId; userAgent: string }): { access: string; refresh: string };
}
