import { UUID } from 'node:crypto';

export interface IRefreshTokensStore {
  save(props: { userId: UUID; refreshToken: string; expiresAt: Date }): Promise<void>;
  hasInStore(props: { userId: UUID; refreshToken: string }): Promise<boolean>;
  delete(props: { userId: UUID; refreshToken: string }): Promise<void>;
  deleteAll(props: { userId: UUID }): Promise<void>;
  getAllByUserId(props: { userId: UUID }): Promise<string[]>;
}
