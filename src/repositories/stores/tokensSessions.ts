import { UserId } from '@/entities';
import { RedisClient } from '@/pkg';
import { createHash } from 'node:crypto';
import { AddSessionParams, ITokensSessionsStore, SessionData, UserSession } from '@/domains/repositories/stores';

export class TokensSessions implements ITokensSessionsStore {
  readonly #redis: RedisClient;
  readonly #sessionsIndexTtlSec: number;

  readonly #SESSION_KEY_PREFIX = 'auth:session';
  readonly #USER_SESSIONS_KEY_PREFIX = 'auth:user-sessions';
  readonly #REFRESH_MAP_KEY_PREFIX = 'auth:refresh';

  constructor(props: { redis: RedisClient; sessionsIndexTtlSec: number }) {
    this.#redis = props.redis;
    this.#sessionsIndexTtlSec = props.sessionsIndexTtlSec;
  }

  async addSession(props: AddSessionParams): Promise<void> {
    const refreshJtiHash = this.#fingerprint(props.refreshJti);
    const accessJtiHash = this.#fingerprint(props.accessJti);
    const sessionKey = this.#buildSessionKey(props.sessionId);
    const refreshMapKey = this.#buildRefreshMapKey(refreshJtiHash);
    const userSessionsKey = this.#buildUserSessionsKey(props.userId);

    const ttlSec = this.#ttlSecondsFromEpochMs(props.expiresAt);

    await this.#redis
      .multi()
      .hSet(sessionKey, {
        userId: props.userId,
        sessionId: props.sessionId,
        userAgent: props.userAgent,
        expiresAt: String(props.expiresAt),
        refreshJtiHash,
        accessJtiHash,
        accessExpiresAt: String(props.accessExpiresAt),
      })
      .expire(sessionKey, ttlSec)
      .setEx(refreshMapKey, ttlSec, props.sessionId)
      .sAdd(userSessionsKey, props.sessionId)
      .expire(userSessionsKey, this.#sessionsIndexTtlSec)
      .exec();

    await this.#pruneUserSessions(props.userId);
  }

  async getSessionByRefreshJti(props: { userId: UserId; refreshJti: string }): Promise<SessionData | null> {
    const refreshJtiHash = this.#fingerprint(props.refreshJti);
    const refreshMapKey = this.#buildRefreshMapKey(refreshJtiHash);
    const sessionId = await this.#redis.get(refreshMapKey);
    if (!sessionId) return null;

    const session = await this.getSessionById({ sessionId });
    if (!session) return null;
    if (session.userId !== props.userId) return null;

    return session;
  }

  async getSessionById(props: { sessionId: string }): Promise<SessionData | null> {
    const sessionKey = this.#buildSessionKey(props.sessionId);
    const sessionData = await this.#redis.hGetAll(sessionKey);

    if (!sessionData || Object.keys(sessionData).length === 0) {
      return null;
    }

    return {
      userId: sessionData.userId as UserId,
      sessionId: sessionData.sessionId ?? props.sessionId,
      userAgent: sessionData.userAgent ?? '',
      expiresAt: parseInt(sessionData.expiresAt ?? '0', 10),
      refreshJtiHash: sessionData.refreshJtiHash ?? '',
      accessJtiHash: sessionData.accessJtiHash ?? '',
      accessExpiresAt: parseInt(sessionData.accessExpiresAt ?? '0', 10),
    };
  }

  async getUserSessions(props: { userId: UserId; currentSessionId?: string }) {
    const userSessionsKey = this.#buildUserSessionsKey(props.userId);
    const sessionIds = await this.#redis.sMembers(userSessionsKey);
    if (sessionIds.length === 0) return [];

    const result: UserSession[] = [];

    for (const sessionId of sessionIds) {
      const session = await this.getSessionById({ sessionId });
      if (!session) {
        await this.#redis.sRem(userSessionsKey, sessionId);
        continue;
      }
      if (session.userId !== props.userId) {
        await this.#redis.sRem(userSessionsKey, sessionId);
        continue;
      }

      result.push({
        userId: session.userId,
        sessionId: session.sessionId,
        userAgent: session.userAgent,
        expiresAt: session.expiresAt,
        isCurrent: props.currentSessionId === session.sessionId,
      });
    }

    return result;
  }

  async deleteSessionById(props: { userId: UserId; sessionId: string }): Promise<void> {
    const session = await this.getSessionById({ sessionId: props.sessionId });
    const userSessionsKey = this.#buildUserSessionsKey(props.userId);

    if (!session || session.userId !== props.userId) {
      await this.#redis.sRem(userSessionsKey, props.sessionId);
      return;
    }

    const sessionKey = this.#buildSessionKey(props.sessionId);
    const refreshMapKey = this.#buildRefreshMapKey(session.refreshJtiHash);
    await this.#redis.multi().del(sessionKey).del(refreshMapKey).sRem(userSessionsKey, props.sessionId).exec();
  }

  async deleteSessionByRefreshJti(props: { userId: UserId; refreshJti: string }): Promise<void> {
    const session = await this.getSessionByRefreshJti(props);
    if (!session) return;
    await this.deleteSessionById({ userId: props.userId, sessionId: session.sessionId });
  }

  async deleteAllSessions(props: { userId: UserId }): Promise<void> {
    const userSessionsKey = this.#buildUserSessionsKey(props.userId);
    const sessionIds = await this.#redis.sMembers(userSessionsKey);

    if (sessionIds.length === 0) {
      await this.#redis.del(userSessionsKey);
      return;
    }

    const pipeline = this.#redis.multi();
    for (const sessionId of sessionIds) {
      const session = await this.getSessionById({ sessionId });
      pipeline.del(this.#buildSessionKey(sessionId));
      if (session?.refreshJtiHash) {
        pipeline.del(this.#buildRefreshMapKey(session.refreshJtiHash));
      }
    }
    pipeline.del(userSessionsKey);

    await pipeline.exec();
  }

  #buildSessionKey(sessionId: string): string {
    return `${this.#SESSION_KEY_PREFIX}:${sessionId}`;
  }

  #buildUserSessionsKey(userId: UserId): string {
    return `${this.#USER_SESSIONS_KEY_PREFIX}:${userId}`;
  }

  #buildRefreshMapKey(refreshJtiHash: string): string {
    return `${this.#REFRESH_MAP_KEY_PREFIX}:${refreshJtiHash}`;
  }

  #fingerprint(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  #ttlSecondsFromEpochMs(expiresAtMs: number): number {
    const ttlMs = expiresAtMs - Date.now();
    return Math.max(1, Math.floor(ttlMs / 1000));
  }

  async #pruneUserSessions(userId: UserId): Promise<void> {
    const userSessionsKey = this.#buildUserSessionsKey(userId);
    const sessionIds = await this.#redis.sMembers(userSessionsKey);
    if (sessionIds.length === 0) return;

    for (const sessionId of sessionIds) {
      const session = await this.getSessionById({ sessionId });
      if (!session || session.userId !== userId || session.expiresAt <= Date.now()) {
        await this.#redis.sRem(userSessionsKey, sessionId);
      }
    }
  }
}
