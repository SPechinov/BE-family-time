import { RedisClient } from '@/pkg';
import { IRefreshTokensStore } from '@/domains/repositories/stores';
import { UUID } from 'node:crypto';

export class RefreshTokensStore implements IRefreshTokensStore {
  #redis: RedisClient;

  constructor(props: { redis: RedisClient }) {
    this.#redis = props.redis;
  }

  async save(props: { userId: UUID; refreshToken: string; expiresAt: Date }): Promise<void> {
    const key = this.#generateRedisKey(props.userId, props.refreshToken);
    const ttl = Math.floor((props.expiresAt.getTime() - Date.now()) / 1000);

    await this.#redis.setEx(key, ttl, '1');
  }

  async hasInStore(props: { userId: UUID; refreshToken: string }): Promise<boolean> {
    const key = this.#generateRedisKey(props.userId, props.refreshToken);
    const exists = await this.#redis.exists(key);
    return exists === 1;
  }

  async delete(props: { userId: UUID; refreshToken: string }): Promise<void> {
    const key = this.#generateRedisKey(props.userId, props.refreshToken);
    await this.#redis.del(key);
  }

  async deleteAll(props: { userId: UUID }): Promise<void> {
    const pattern = this.#generateRedisKey(props.userId, '*');
    const keys = await this.#redis.keys(pattern);

    if (keys.length < 1) return;
    await Promise.all(keys.map((key) => this.#redis.del(key)));
  }

  async getAllByUserId(props: { userId: UUID }): Promise<string[]> {
    const pattern = this.#generateRedisKey(props.userId, '*');
    return (await this.#redis.keys(pattern)).map((key) => key.split(':')[2]);
  }

  #generateRedisKey(userId: UUID, value: string) {
    return `refresh-token:${userId}:${value}`;
  }
}
