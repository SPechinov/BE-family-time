import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import { RefreshTokensStore } from '@/api/rest/services/tokens/refreshTokensStore';
import { createClient } from 'redis';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { UserId } from '@/entities';

// Helper to generate test UUIDs
const generateTestId = (): UserId => {
  const hex = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  return hex as UserId;
};

describe('RefreshTokensStore', () => {
  let redisContainer: StartedRedisContainer;
  let redis: ReturnType<typeof createClient>;
  let store: RefreshTokensStore;

  const testUserId: UserId = generateTestId();
  const testRefreshToken = 'test.jwt.refresh.token.here';
  const testUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  const testExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days from now

  beforeAll(async () => {
    // Start Redis container
    redisContainer = await new RedisContainer('redis:7.4').withPassword('test').start();

    // Connect to Redis
    const redisPassword = 'test';
    const redisUri = `redis://default:${redisPassword}@${redisContainer.getHost()}:${redisContainer.getPort()}`;
    redis = createClient({ url: redisUri });
    await redis.connect();

    // Create store instance
    store = new RefreshTokensStore({ redis });
  });

  beforeEach(async () => {
    // Clean up Redis before each test
    await redis.flushDb();
  });

  afterAll(async () => {
    // Cleanup
    await redis.quit();
    await redisContainer.stop();
  });

  describe('setSession', () => {
    it('should save a session to Redis', async () => {
      await store.setSession({
        userId: testUserId,
        refreshToken: testRefreshToken,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      // Verify session was saved
      const sessions = await store.getAllSessions({ userId: testUserId });
      expect(sessions).toHaveLength(1);
      expect(sessions[0].userAgent).toBe(testUserAgent);
      expect(sessions[0].expiresAt).toBe(testExpiresAt);
    });

    it('should set TTL for the session', async () => {
      const shortExpiresAt = Date.now() + 5000; // 5 seconds from now

      await store.setSession({
        userId: testUserId,
        refreshToken: testRefreshToken,
        userAgent: testUserAgent,
        expiresAt: shortExpiresAt,
      });

      // Get TTL from Redis
      const sessionKey = `session:${testUserId}:${testRefreshToken.slice(-8)}`;
      const ttl = await redis.ttl(sessionKey);

      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(5);
    });

    it('should store multiple sessions for the same user', async () => {
      const token1 = 'token.one.here';
      const token2 = 'token.two.here';

      await store.setSession({
        userId: testUserId,
        refreshToken: token1,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      await store.setSession({
        userId: testUserId,
        refreshToken: token2,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      const sessions = await store.getAllSessions({ userId: testUserId });
      expect(sessions).toHaveLength(2);
    });
  });

  describe('getSession', () => {
    it('should return session data for valid token', async () => {
      await store.setSession({
        userId: testUserId,
        refreshToken: testRefreshToken,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      const session = await store.getSession({
        userId: testUserId,
        refreshToken: testRefreshToken,
      });

      expect(session).not.toBeNull();
      expect(session?.userAgent).toBe(testUserAgent);
      expect(session?.expiresAt).toBe(testExpiresAt);
    });

    it('should return null for non-existent session', async () => {
      const session = await store.getSession({
        userId: testUserId,
        refreshToken: 'non.existent.token',
      });

      expect(session).toBeNull();
    });

    it('should return null for wrong user', async () => {
      const otherUserId = generateTestId();

      await store.setSession({
        userId: testUserId,
        refreshToken: testRefreshToken,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      const session = await store.getSession({
        userId: otherUserId,
        refreshToken: testRefreshToken,
      });

      expect(session).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete a specific session', async () => {
      const token1 = 'token.one.here';
      const token2 = 'token.two.here';

      await store.setSession({
        userId: testUserId,
        refreshToken: token1,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      await store.setSession({
        userId: testUserId,
        refreshToken: token2,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      // Delete first session
      await store.deleteSession({
        userId: testUserId,
        refreshToken: token1,
      });

      const sessions = await store.getAllSessions({ userId: testUserId });
      expect(sessions).toHaveLength(1);
      expect(sessions[0].refreshToken).toBe('');
    });

    it('should not throw error for non-existent session', async () => {
      await expect(
        store.deleteSession({
          userId: testUserId,
          refreshToken: 'non.existent.token',
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('deleteAllSessions', () => {
    it('should delete all sessions for a user', async () => {
      const token1 = 'token.one.here';
      const token2 = 'token.two.here';
      const token3 = 'token.three.here';

      await store.setSession({
        userId: testUserId,
        refreshToken: token1,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      await store.setSession({
        userId: testUserId,
        refreshToken: token2,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      await store.setSession({
        userId: testUserId,
        refreshToken: token3,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      // Delete all sessions
      await store.deleteAllSessions({ userId: testUserId });

      const sessions = await store.getAllSessions({ userId: testUserId });
      expect(sessions).toHaveLength(0);
    });

    it('should not affect other users sessions', async () => {
      const otherUserId = generateTestId();

      await store.setSession({
        userId: testUserId,
        refreshToken: testRefreshToken,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      await store.setSession({
        userId: otherUserId,
        refreshToken: testRefreshToken,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      // Delete all sessions for test user only
      await store.deleteAllSessions({ userId: testUserId });

      const testUserSessions = await store.getAllSessions({ userId: testUserId });
      const otherUserSessions = await store.getAllSessions({ userId: otherUserId });

      expect(testUserSessions).toHaveLength(0);
      expect(otherUserSessions).toHaveLength(1);
    });

    it('should handle empty sessions gracefully', async () => {
      await expect(store.deleteAllSessions({ userId: testUserId })).resolves.not.toThrow();
    });
  });

  describe('getAllSessions', () => {
    it('should return all sessions for a user', async () => {
      const token1 = 'token.one.here';
      const token2 = 'token.two.here';

      await store.setSession({
        userId: testUserId,
        refreshToken: token1,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      await store.setSession({
        userId: testUserId,
        refreshToken: token2,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      const sessions = await store.getAllSessions({ userId: testUserId });
      expect(sessions).toHaveLength(2);
    });

    it('should mark current session correctly', async () => {
      const token1 = 'token.one.here';
      const token2 = 'token.two.here';

      await store.setSession({
        userId: testUserId,
        refreshToken: token1,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      await store.setSession({
        userId: testUserId,
        refreshToken: token2,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      const sessions = await store.getAllSessions({
        userId: testUserId,
        currentRefreshToken: token2,
      });

      const currentSession = sessions.find((s) => s.isCurrent);
      expect(currentSession).toBeDefined();
    });

    it('should return empty array for user with no sessions', async () => {
      const sessions = await store.getAllSessions({ userId: testUserId });
      expect(sessions).toHaveLength(0);
    });

    it('should not include refreshToken in returned data', async () => {
      await store.setSession({
        userId: testUserId,
        refreshToken: testRefreshToken,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      const sessions = await store.getAllSessions({ userId: testUserId });
      expect(sessions[0].refreshToken).toBe('');
    });
  });

  describe('getCurrentSession', () => {
    it('should return session data for current token', async () => {
      await store.setSession({
        userId: testUserId,
        refreshToken: testRefreshToken,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      const session = await store.getCurrentSession({
        userId: testUserId,
        refreshToken: testRefreshToken,
      });

      expect(session).not.toBeNull();
      expect(session?.userAgent).toBe(testUserAgent);
      expect(session?.expiresAt).toBe(testExpiresAt);
    });

    it('should return null for non-existent session', async () => {
      const session = await store.getCurrentSession({
        userId: testUserId,
        refreshToken: 'non.existent.token',
      });

      expect(session).toBeNull();
    });
  });

  describe('fingerprint generation', () => {
    it('should generate consistent fingerprints for the same token', async () => {
      // This is implicitly tested by other tests, but let's verify
      await store.setSession({
        userId: testUserId,
        refreshToken: testRefreshToken,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      // Get session twice - should work both times
      const session1 = await store.getSession({
        userId: testUserId,
        refreshToken: testRefreshToken,
      });

      const session2 = await store.getSession({
        userId: testUserId,
        refreshToken: testRefreshToken,
      });

      expect(session1).toEqual(session2);
    });

    it('should generate different fingerprints for different tokens', async () => {
      const token1 = 'token.one.here';
      const token2 = 'token.two.here';

      await store.setSession({
        userId: testUserId,
        refreshToken: token1,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      await store.setSession({
        userId: testUserId,
        refreshToken: token2,
        userAgent: testUserAgent,
        expiresAt: testExpiresAt,
      });

      const sessions = await store.getAllSessions({ userId: testUserId });
      expect(sessions).toHaveLength(2);
    });
  });
});
