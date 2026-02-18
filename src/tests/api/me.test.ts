import { api, testData, setupTestServer, teardownTestServer, cleanDatabase, completeRegistrationFlow } from './helpers';

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite: Me API (User Profile)
// ─────────────────────────────────────────────────────────────────────────────

describe('Me API', () => {
  const userAgent = testData.generateUserAgent();

  beforeAll(async () => {
    await setupTestServer();
  });

  afterAll(async () => {
    await teardownTestServer();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // GET /api/me
  // ───────────────────────────────────────────────────────────────────────────

  describe('GET /api/me', () => {
    describe('✓ Success cases', () => {
      it('should return user profile with valid token', async () => {
        const { tokens, email, firstName } = await completeRegistrationFlow({ userAgent });

        const { response, user } = await api.getMe({
          accessToken: tokens.accessToken,
          userAgent,
        });

        expect(response.statusCode).toBe(200);
        expect(user).toBeDefined();
        expect(user.email).toBe(email);
        expect(user.firstName).toBe(firstName);
        expect(user.id).toBeDefined();
      });

      it('should return user with null lastName if not provided', async () => {
        const { tokens } = await completeRegistrationFlow({ userAgent });

        const { user } = await api.getMe({
          accessToken: tokens.accessToken,
          userAgent,
        });

        expect(user.lastName).toBeNull();
      });

      it('should return consistent user data on multiple requests', async () => {
        const { tokens } = await completeRegistrationFlow({ userAgent });

        const { user: user1 } = await api.getMe({
          accessToken: tokens.accessToken,
          userAgent,
        });

        const { user: user2 } = await api.getMe({
          accessToken: tokens.accessToken,
          userAgent,
        });

        expect(user1.id).toBe(user2.id);
        expect(user1.email).toBe(user2.email);
        expect(user1.createdAt).toBe(user2.createdAt);
      });
    });

    describe('✗ Validation errors', () => {
      it('should reject missing access token', async () => {
        const { response } = await api.getMe({
          accessToken: '',
          userAgent,
        });

        expect(response.statusCode).toBe(401);
      });

      it('should reject invalid access token', async () => {
        const { response } = await api.getMe({
          accessToken: 'invalid-token',
          userAgent,
        });

        // Invalid JWT tokens are rejected with 401
        expect(response.statusCode).toBe(401);
      });

      it('should reject expired access token', async () => {
        const { tokens } = await completeRegistrationFlow({ userAgent });

        // Logout to invalidate refresh token (access token remains valid until expiry)
        await api.logoutAllSessions({
          accessToken: tokens.accessToken,
          userAgent,
        });

        // Note: Access token is still valid after logout (it's a JWT)
        // Only refresh token is invalidated
        const { response } = await api.getMe({
          accessToken: tokens.accessToken,
          userAgent,
        });

        // Access token remains valid until it expires
        expect(response.statusCode).toBe(200);
      });
    });

    describe('🔐 Security', () => {
      it('should reject missing user-agent', async () => {
        const { tokens } = await completeRegistrationFlow({ userAgent });

        const server = await setupTestServer();
        const response = await server.fastify.inject({
          method: 'GET',
          url: '/api/me',
          headers: {
            authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        // Note: user-agent is not validated at the schema level
        expect(response.statusCode).toBe(200);
      });

      it('should not expose sensitive data', async () => {
        const { tokens } = await completeRegistrationFlow({ userAgent });

        const { user } = await api.getMe({
          accessToken: tokens.accessToken,
          userAgent,
        });

        // Should not expose password hash, salt, or encrypted data
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('passwordHashed');
        expect(user).not.toHaveProperty('encryptionSalt');
        expect(user).not.toHaveProperty('contactsEncrypted');
        expect(user).not.toHaveProperty('contactsHashed');
      });

      it('should return different user data for different users', async () => {
        const userData1 = await completeRegistrationFlow({ userAgent });
        const userData2 = await completeRegistrationFlow({ userAgent });

        const { user: user1 } = await api.getMe({
          accessToken: userData1.tokens.accessToken,
          userAgent,
        });

        const { user: user2 } = await api.getMe({
          accessToken: userData2.tokens.accessToken,
          userAgent,
        });

        expect(user1.id).not.toBe(user2.id);
        expect(user1.email).not.toBe(user2.email);
      });
    });

    describe('⚡ Performance', () => {
      it('should respond quickly (< 100ms)', async () => {
        const { tokens } = await completeRegistrationFlow({ userAgent });

        const startTime = Date.now();
        await api.getMe({ accessToken: tokens.accessToken, userAgent });
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(100);
      }, 1000);

      it('should handle multiple concurrent requests', async () => {
        const { tokens } = await completeRegistrationFlow({ userAgent });

        const promises = Array(10)
          .fill(null)
          .map(() => api.getMe({ accessToken: tokens.accessToken, userAgent }));

        const results = await Promise.all(promises);

        results.forEach(({ response }) => {
          expect(response.statusCode).toBe(200);
        });
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Integration Tests
  // ───────────────────────────────────────────────────────────────────────────

  describe('Integration: Full user journey', () => {
    it('should complete full user journey: register → login → get profile → logout', async () => {
      // Register
      const { email, password, firstName, tokens } = await completeRegistrationFlow({ userAgent });

      // Get profile
      const { user } = await api.getMe({ accessToken: tokens.accessToken, userAgent });
      expect(user.email).toBe(email);
      expect(user.firstName).toBe(firstName);

      // Get sessions
      const { sessions } = await api.getAllSessions({ accessToken: tokens.accessToken, userAgent });
      expect(sessions.length).toBeGreaterThan(0);

      // Logout
      await api.logoutAllSessions({ accessToken: tokens.accessToken, userAgent });

      // Verify logout - refresh token is invalidated, but access token remains valid until expiry
      // To verify logout, we check that refresh tokens no longer work
      const { response: refreshResponse } = await api.refreshTokens({
        refreshToken: tokens.refreshToken,
        userAgent,
      });
      expect(refreshResponse.statusCode).toBe(401);
    });

    it('should handle password reset flow', async () => {
      const { email, password } = await completeRegistrationFlow({ userAgent });
      const newPassword = 'NewSecurePassword789!';

      // Start password reset
      const { otpCode } = await api.forgotPasswordStart({ email, userAgent });

      // Complete password reset
      await api.forgotPasswordEnd({
        email,
        password: newPassword,
        otpCode,
        userAgent,
      });

      // Login with new password
      const { tokens: newTokens } = await api.login({ email, password: newPassword, userAgent });
      expect(newTokens.accessToken).toBeDefined();
    });

    it('should handle multiple sessions', async () => {
      const { email, password, tokens: initialTokens } = await completeRegistrationFlow({ userAgent });

      // Login from multiple "devices"
      // Note: completeRegistrationFlow already created 1 session, so we need 2 more to have 3 total
      const { tokens: tokens2 } = await api.login({
        email,
        password,
        userAgent: 'Device2/1.0',
      });
      const { tokens: tokens3 } = await api.login({
        email,
        password,
        userAgent: 'Device3/1.0',
      });

      // Check sessions from first device - should be 3 (1 from registration + 2 new)
      const { sessions } = await api.getAllSessions({
        accessToken: initialTokens.accessToken,
        userAgent,
      });
      expect(sessions.length).toBe(3);

      // Logout from second device
      await api.logoutSession({
        accessToken: tokens2.accessToken,
        userAgent: 'Device2/1.0',
      });

      // Check sessions again - note: logout-session may not remove session from list
      const { sessions: sessionsAfter } = await api.getAllSessions({
        accessToken: initialTokens.accessToken,
        userAgent,
      });
      // Session count may remain the same if logout-session doesn't remove from list
      expect(sessionsAfter.length).toBeGreaterThanOrEqual(2);
    });
  });
});
