import { RedisClient } from '@/pkg';
import { createHash } from 'node:crypto';
import { ITokensSessionsBlacklistStore } from '@/domains/repositories/stores';

export class TokensSessionsBlacklistStore implements ITokensSessionsBlacklistStore {
  readonly #redis: RedisClient;

  readonly #ACCESS_BLACKLIST_KEY_PREFIX = 'auth:blacklist:access';

  constructor(props: { redis: RedisClient; sessionsIndexTtlSec: number }) {
    this.#redis = props.redis;
  }

  async addAccessJtiToBlacklist(props: { accessJti: string; expiresAt: number }): Promise<void> {
    const ttlSec = this.#ttlSecondsFromEpochMs(props.expiresAt);
    const key = this.#buildAccessBlacklistKey(props.accessJti);
    await this.#redis.setEx(key, ttlSec, '1');
  }

  async hasAccessJtiInBlacklist(props: { accessJti: string }): Promise<boolean> {
    const key = this.#buildAccessBlacklistKey(props.accessJti);
    const exists = await this.#redis.exists(key);
    return exists === 1;
  }

  async addHashedAccessJtiToBlacklist(props: { accessJtiHash: string; expiresAt: number }): Promise<void> {
    if (!props.accessJtiHash) return;
    const ttlSec = this.#ttlSecondsFromEpochMs(props.expiresAt);
    const key = this.#buildAccessBlacklistKeyByHash(props.accessJtiHash);
    await this.#redis.setEx(key, ttlSec, '1');
  }

  #buildAccessBlacklistKey(accessJti: string): string {
    return `${this.#ACCESS_BLACKLIST_KEY_PREFIX}:${this.#fingerprint(accessJti)}`;
  }

  #buildAccessBlacklistKeyByHash(accessJtiHash: string): string {
    return `${this.#ACCESS_BLACKLIST_KEY_PREFIX}:${accessJtiHash}`;
  }

  #fingerprint(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  #ttlSecondsFromEpochMs(expiresAtMs: number): number {
    const ttlMs = expiresAtMs - Date.now();
    return Math.max(1, Math.floor(ttlMs / 1000));
  }
}
