export interface IJwtService {
  generateAccessToken(payload: { userId: string }): string;

  generateRefreshToken(payload: { userId: string }): string;

  verifyAccessToken(token: string): { userId: string } | null;

  verifyRefreshToken(token: string): { userId: string } | null;

  parseToken(token: string): Record<string, unknown> | string | null;
}
