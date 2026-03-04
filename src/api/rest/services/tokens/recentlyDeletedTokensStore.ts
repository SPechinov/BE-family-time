import { createHash } from 'node:crypto';
import { CONFIG } from '@/config';
import { RedisClient } from '@/pkg';
import { UserId } from '@/entities';

/**
 * Store for tracking recently deleted refresh tokens.
 * Used to detect token reuse attacks - when a deleted/invalidated token is used again.
 */
export class RecentlyDeletedTokensStore {
  #redis: RedisClient;
  #RECENTLY_DELETED_KEY_PREFIX = 'recently-deleted-tokens';
  #REFRESH_TOKEN_EXPIRY = CONFIG.jwt.refresh.expiry;
  #TTL_BUFFER_MULTIPLIER = 1.2;

  constructor(props: { redis: RedisClient }) {
    this.#redis = props.redis;
  }

  /**
   * Add a deleted token fingerprint to the recently deleted store
   * TTL is set to refresh token expiry + 20% buffer
   */
  async addDeletedToken(options: { userId: UserId; refreshToken: string }): Promise<void> {
    const { userId, refreshToken } = options;
    const fingerprint = this.#generateFingerprint(refreshToken);
    const key = this.#buildKey(userId, fingerprint);
    const ttlSeconds = this.#calculateTTL();

    await this.#redis.set(key, '1', { EX: ttlSeconds });
  }

  /**
   * Check if a token was recently deleted (and thus should trigger security response)
   * @returns true if the token was found in the recently deleted store
   */
  async isRecentlyDeleted(options: { userId: UserId; refreshToken: string }): Promise<boolean> {
    const { userId, refreshToken } = options;
    const fingerprint = this.#generateFingerprint(refreshToken);
    const key = this.#buildKey(userId, fingerprint);

    const value = await this.#redis.get(key);
    return value !== null;
  }

  /**
   * Generate a fingerprint for the refresh token using SHA-256 hash
   * @returns A short fingerprint (last 8 characters of hash)
   */
  #generateFingerprint(refreshToken: string): string {
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    return hash.slice(-8);
  }

  /**
   * Build Redis key for recently deleted token
   * @returns Redis key in format: recently-deleted-tokens:{userId}:{fingerprint}
   */
  #buildKey(userId: UserId, fingerprint: string): string {
    return `${this.#RECENTLY_DELETED_KEY_PREFIX}:${userId}:${fingerprint}`;
  }

  /**
   * Calculate TTL for recently deleted tokens
   * Uses refresh token expiry + 20% buffer to ensure detection even after token expires
   */
  #calculateTTL(): number {
    const ttlMs = this.#REFRESH_TOKEN_EXPIRY * this.#TTL_BUFFER_MULTIPLIER;
    return Math.max(60, Math.floor(ttlMs / 1000)); // Minimum 60 seconds
  }
}
