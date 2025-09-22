export interface IRefreshTokenStoreService {
  saveRefreshToken(props: { userId: string; refreshToken: string; expiresAt: Date }): Promise<void>;
  isRefreshTokenValid(props: { userId: string; refreshToken: string }): Promise<boolean>;
  deleteRefreshToken(props: { userId: string; refreshToken?: string }): Promise<void>;
  deleteAllUserRefreshTokens(props: { userId: string }): Promise<void>;
}