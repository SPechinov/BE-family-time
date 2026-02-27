import { UserId } from '@/entities';

export interface IRefreshTokensStore {
  save(props: { userId: UserId; refreshToken: string; expiresAt: Date }): Promise<void>;
  hasInStore(props: { userId: UserId; refreshToken: string }): Promise<boolean>;
  delete(props: { userId: UserId; refreshToken: string }): Promise<void>;
  deleteAll(props: { userId: UserId }): Promise<void>;
  getAllByUserId(props: { userId: UserId }): Promise<string[]>;
}
