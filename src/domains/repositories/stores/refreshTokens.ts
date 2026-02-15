export interface IRefreshTokensStore {
  save(props: { userId: string; refreshToken: string; expiresAt: Date }): Promise<void>;
  isValid(props: { userId: string; refreshToken: string }): Promise<boolean>;
  delete(props: { userId: string; refreshToken?: string }): Promise<void>;
  deleteAll(props: { userId: string }): Promise<void>;
  getAllByUserId(props: { userId: string }): Promise<string[]>;
}
