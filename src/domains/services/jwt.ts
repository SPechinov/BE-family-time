import { UUID } from 'node:crypto';

export interface IJwtService {
  generateAccessToken(payload: { userId: UUID }): string;

  generateRefreshToken(payload: { userId: UUID }): string;

  verifyAccessToken(token: string): { userId: UUID } | null;

  verifyRefreshToken(token: string): { userId: UUID } | null;

  parseToken(token: string): Record<string, unknown> | string | null;
}
