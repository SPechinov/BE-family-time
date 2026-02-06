import { RedisClient } from '@/pkg';
import { IRefreshTokensStore } from '@/domains/repositories/stores';

export class RefreshTokensStore implements IRefreshTokensStore {
  #redis: RedisClient;

  constructor(props: { redis: RedisClient }) {
    this.#redis = props.redis;
  }

  async save(props: { userId: string; refreshToken: string; expiresAt: Date }): Promise<void> {
    const key = `refresh-token:${props.userId}:${props.refreshToken}`;
    const ttl = Math.floor((props.expiresAt.getTime() - Date.now()) / 1000);

    await this.#redis.setEx(key, ttl, '1');
  }

  async isValid(props: { userId: string; refreshToken: string }): Promise<boolean> {
    const key = `refresh-token:${props.userId}:${props.refreshToken}`;
    const exists = await this.#redis.exists(key);
    return exists === 1;
  }

  async delete(props: { userId: string; refreshToken?: string }): Promise<void> {
    if (props.refreshToken) {
      const key = `refresh-token:${props.userId}:${props.refreshToken}`;
      await this.#redis.del(key);
    }
  }

  async deleteAll(props: { userId: string }): Promise<void> {
    const pattern = `refresh-token:${props.userId}:*`;
    const keys = await this.#redis.keys(pattern);

    if (keys.length < 1) return;
    await Promise.all(keys.map((key) => this.#redis.del(key)));
  }
}
