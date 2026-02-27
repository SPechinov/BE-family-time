import { UserId } from '@/entities';

export interface IJwtService {
  generateAccessToken(payload: { userId: UserId }): string;

  generateRefreshToken(payload: { userId: UserId }): string;

  verifyAccessToken(token: string): { userId: UserId } | null;

  verifyRefreshToken(token: string): { userId: UserId } | null;

  parseToken(token: string): Record<string, unknown> | string | null;
}
