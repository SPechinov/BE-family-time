import { IRefreshTokenStoreService } from '@/domain/services';
import { RedisClient } from '@/pkg';

export class RefreshTokenStoreService implements IRefreshTokenStoreService {
  #redis: RedisClient;

  constructor(props: { redis: RedisClient }) {
    this.#redis = props.redis;
  }

  async saveRefreshToken(props: { userId: string; refreshToken: string; expiresAt: Date }): Promise<void> {
    const key = `refresh_token:${props.userId}:${props.refreshToken}`;
    const ttl = Math.floor((props.expiresAt.getTime() - Date.now()) / 1000);

    await this.#redis.setex(key, ttl, '1');
  }

  async isRefreshTokenValid(props: { userId: string; refreshToken: string }): Promise<boolean> {
    const key = `refresh_token:${props.userId}:${props.refreshToken}`;
    const exists = await this.#redis.exists(key);
    return exists === 1;
  }

  async deleteRefreshToken(props: { userId: string; refreshToken?: string }): Promise<void> {
    if (props.refreshToken) {
      const key = `refresh_token:${props.userId}:${props.refreshToken}`;
      await this.#redis.del(key);
    }
  }

  async deleteAllUserRefreshTokens(props: { userId: string }): Promise<void> {
    const pattern = `refresh_token:${props.userId}:*`;
    const keys = await this.#redis.keys(pattern);

    if (keys.length > 0) {
      await Promise.all(keys.map(key => this.#redis.del(key)));
    }
  }
}
