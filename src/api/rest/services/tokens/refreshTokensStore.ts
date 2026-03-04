import { createHash, UUID } from 'node:crypto';
import { RedisClient } from '@/pkg';
import { UserId } from '@/entities';

export interface SessionData {
  id: UserId;
  userAgent: string;
  expiresAt: number;
}

export interface SessionWithToken extends SessionData {
  isCurrent: boolean;
  refreshToken: string;
}

export class RefreshTokensStore {
  #redis: RedisClient;
  #SESSION_KEY_PREFIX = 'session';
  #SESSIONS_SET_PREFIX = 'sessions';

  constructor(props: { redis: RedisClient }) {
    this.#redis = props.redis;
  }

  /**
   * Save a session (refresh token) to Redis
   */
  async setSession(options: {
    userId: UserId;
    refreshToken: string;
    userAgent: string;
    expiresAt: number;
  }): Promise<void> {
    const { userId, refreshToken, userAgent, expiresAt } = options;
    const sessionKey = this.#buildSessionKey(userId, refreshToken);
    const sessionsSetKey = this.#buildSessionsSetKey(userId);

    const sessionData: Record<string, string> = {
      id: userId,
      userAgent,
      expiresAt: expiresAt.toString(),
    };

    const ttlMs = expiresAt - Date.now();
    const ttlSeconds = Math.max(1, Math.floor(ttlMs / 1000));

    await this.#redis
      .multi()
      .hSet(sessionKey, sessionData)
      .expire(sessionKey, ttlSeconds)
      .sAdd(sessionsSetKey, sessionKey)
      .exec();
  }

  /**
   * Get session information by refresh token
   * @returns Session data or null if not found
   */
  async getSession(options: { userId: UserId; refreshToken: string }): Promise<SessionData | null> {
    const { userId, refreshToken } = options;
    const sessionKey = this.#buildSessionKey(userId, refreshToken);

    const sessionData = await this.#redis.hGetAll(sessionKey);

    if (!sessionData || Object.keys(sessionData).length === 0) {
      return null;
    }

    return {
      id: (sessionData.id ?? userId) as UUID as UserId,
      userAgent: sessionData.userAgent ?? '',
      expiresAt: parseInt(sessionData.expiresAt ?? '0', 10),
    };
  }

  /**
   * Delete a specific session
   */
  async deleteSession(options: { userId: UserId; refreshToken: string }): Promise<void> {
    const { userId, refreshToken } = options;
    const sessionKey = this.#buildSessionKey(userId, refreshToken);
    const sessionsSetKey = this.#buildSessionsSetKey(userId);

    await this.#redis.multi().del(sessionKey).sRem(sessionsSetKey, sessionKey).exec();
  }

  /**
   * Delete all sessions for a user
   */
  async deleteAllSessions(options: { userId: UserId }): Promise<void> {
    const { userId } = options;
    const sessionsSetKey = this.#buildSessionsSetKey(userId);

    const sessionKeys = await this.#redis.sMembers(sessionsSetKey);

    if (sessionKeys.length === 0) {
      return;
    }

    const pipeline = this.#redis.multi();
    for (const key of sessionKeys) {
      pipeline.del(key);
    }
    pipeline.del(sessionsSetKey);
    await pipeline.exec();
  }

  /**
   * Get all sessions for a user
   * @returns Array of session data with isCurrent flag
   */
  async getAllSessions(options: { userId: UserId; currentRefreshToken?: string }): Promise<SessionWithToken[]> {
    const { userId, currentRefreshToken } = options;
    const sessionsSetKey = this.#buildSessionsSetKey(userId);

    const sessionKeys = await this.#redis.sMembers(sessionsSetKey);

    if (sessionKeys.length === 0) {
      return [];
    }

    const sessions: SessionWithToken[] = [];
    for (const sessionKey of sessionKeys) {
      const sessionData = await this.#redis.hGetAll(sessionKey);

      if (!sessionData || Object.keys(sessionData).length === 0) {
        await this.#redis.sRem(sessionsSetKey, sessionKey);
        continue;
      }

      const keyParts = sessionKey.split(':');
      const fingerprint = keyParts[keyParts.length - 1];
      const isCurrent = currentRefreshToken && this.#generateFingerprint(currentRefreshToken) === fingerprint;

      sessions.push({
        id: (sessionData.id ?? userId) as UserId,
        userAgent: sessionData.userAgent ?? '',
        expiresAt: parseInt(sessionData.expiresAt ?? '0', 10),
        isCurrent: Boolean(isCurrent),
        refreshToken: '', // We don't store the full token
      });
    }

    return sessions;
  }

  /**
   * Get current session by refresh token
   * @returns Session data or null if not found
   */
  async getCurrentSession(options: { userId: UserId; refreshToken: string }): Promise<SessionData | null> {
    return this.getSession(options);
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
   * Build Redis key for a specific session
   * @returns Redis key in format: session:{userId}:{fingerprint}
   */
  #buildSessionKey(userId: UserId, refreshToken: string): string {
    const fingerprint = this.#generateFingerprint(refreshToken);
    return `${this.#SESSION_KEY_PREFIX}:${userId}:${fingerprint}`;
  }

  /**
   * Build Redis key for the set of all user sessions
   * @returns Redis key in format: sessions:{userId}
   */
  #buildSessionsSetKey(userId: UserId): string {
    return `${this.#SESSIONS_SET_PREFIX}:${userId}`;
  }
}
