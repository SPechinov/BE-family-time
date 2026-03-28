/**
 * Integration tests for Me API endpoints
 * Tests cover: get current user profile
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createTestAgent, DEFAULT_HEADERS, extractAuthToken, extractCookie } from '../utils/test-http';
import { createUserFixture, USER_AGENTS } from '../fixtures/user.fixture';
import { setupTestEnvironment, teardownTestEnvironment, beforeEachTest } from '../utils/test-setup.js';

// Initialize test context
beforeAll(async () => {
  if (!(globalThis as any).__TEST_CONTEXT__) {
    (globalThis as any).__TEST_CONTEXT__ = await setupTestEnvironment();
    console.log('Test environment initialized');
  }
});

// Cleanup after all tests
afterAll(async () => {
  if ((globalThis as any).__TEST_CONTEXT__) {
    await teardownTestEnvironment();
    (globalThis as any).__TEST_CONTEXT__ = null;
    console.log('Test environment cleaned up');
  }
});

// Cleanup before each test
beforeEach(async () => {
  await beforeEachTest();
});

const API_PREFIX = '/api/me';

describe('Me API Integration Tests', () => {
  let request: any;
  let authToken: string;
  let refreshToken: string;
  let registeredUser: { email: string; password: string; firstName: string };

  // Setup user for all tests in this describe block
  beforeEach(async () => {
    const context = globalThis.__TEST_CONTEXT__;
    if (!context) {
      throw new Error('Test context not initialized. Make sure globalSetup is configured.');
    }
    request = createTestAgent(context.fastify);

    // Register and login to get auth token for each test
    const user = createUserFixture();
    registeredUser = {
      email: user.email,
      password: user.password,
      firstName: user.firstName,
    };

    const startResponse = await request
      .post('/api/auth/registration-start')
      .set(DEFAULT_HEADERS)
      .send({ email: user.email });

    const otpCode = startResponse.headers['x-dev-otp-code'];

    await request.post('/api/auth/registration-end').set(DEFAULT_HEADERS).send({
      email: user.email,
      otpCode,
      firstName: user.firstName,
      password: user.password,
      timeZone: 'Europe/Moscow',
    });

    const loginResponse = await request.post('/api/auth/login').set(DEFAULT_HEADERS).send({
      email: user.email,
      password: user.password,
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    authToken = extractAuthToken(loginResponse)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    refreshToken = extractCookie(loginResponse, 'refreshToken')!;
  });

  describe('GET /me', () => {
    it('should return current user profile', async () => {
      const response = await request.get(API_PREFIX).set({
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${authToken}`,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('firstName');

      // Validate user data
      expect(response.body.email).toBe(registeredUser.email);
      expect(response.body.firstName).toBe(registeredUser.firstName);

      // Validate UUID format
      expect(response.body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should return null for optional fields when not set', async () => {
      const response = await request.get(API_PREFIX).set({
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${authToken}`,
      });

      expect(response.status).toBe(200);

      // Phone should be null if not provided during registration
      expect(response.body.phone).toBeNull();

      // Last name should be null if not provided
      expect(response.body.lastName).toBeNull();
    });

    it('should reject request without auth token', async () => {
      const response = await request.get(API_PREFIX).set(DEFAULT_HEADERS);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code');
    });

    it('should reject request with invalid auth token', async () => {
      const response = await request.get(API_PREFIX).set({
        ...DEFAULT_HEADERS,
        Authorization: 'Bearer invalid.token.here',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code');
    });

    it('should reject request with missing authorization header', async () => {
      const response = await request.get(API_PREFIX).send();

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code');
    });

    it('should reject request with malformed Bearer token', async () => {
      const response = await request.get(API_PREFIX).set({
        ...DEFAULT_HEADERS,
        Authorization: 'InvalidFormat',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code');
    });

    it('should work with different user agents', async () => {
      const userAgents = [USER_AGENTS.chrome, USER_AGENTS.firefox, USER_AGENTS.safari, USER_AGENTS.mobile];

      for (const userAgent of userAgents) {
        const response = await request.get(API_PREFIX).set({
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          Authorization: `Bearer ${authToken}`,
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
      }
    });
  });

  describe('PATCH /me', () => {
    it('should update dateOfBirth without changing firstName/lastName', async () => {
      const dateOfBirth = '1990-01-10T00:00:00.000Z';

      const patchResponse = await request
        .patch(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${authToken}`,
        })
        .send({ dateOfBirth });

      expect(patchResponse.status).toBe(200);
      expect(patchResponse.body.firstName).toBe(registeredUser.firstName);
      expect(patchResponse.body.lastName).toBeNull();
      expect(patchResponse.body.dateOfBirth).toBe(dateOfBirth);

      const getResponse = await request.get(API_PREFIX).set({
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${authToken}`,
      });

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.firstName).toBe(registeredUser.firstName);
      expect(getResponse.body.lastName).toBeNull();
      expect(getResponse.body.dateOfBirth).toBe(dateOfBirth);
    });

    it('should clear dateOfBirth with null', async () => {
      const dateOfBirth = '1991-12-15T00:00:00.000Z';

      await request
        .patch(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${authToken}`,
        })
        .send({ dateOfBirth });

      const clearResponse = await request
        .patch(API_PREFIX)
        .set({
          ...DEFAULT_HEADERS,
          Authorization: `Bearer ${authToken}`,
        })
        .send({ dateOfBirth: null });

      expect(clearResponse.status).toBe(200);
      expect(clearResponse.body.dateOfBirth).toBeNull();
    });
  });

  describe('Response schema validation', () => {
    it('should return response matching User schema', async () => {
      const response = await request.get(API_PREFIX).set({
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${authToken}`,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('phone');
      expect(response.body).toHaveProperty('firstName');
      expect(response.body).toHaveProperty('lastName');
    });

    it('should have valid email format', async () => {
      const response = await request.get(API_PREFIX).set({
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${authToken}`,
      });

      expect(response.status).toBe(200);
      expect(response.body.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should have firstName within valid length (2-40 chars)', async () => {
      const response = await request.get(API_PREFIX).set({
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${authToken}`,
      });

      expect(response.status).toBe(200);
      expect(response.body.firstName.length).toBeGreaterThanOrEqual(2);
      expect(response.body.firstName.length).toBeLessThanOrEqual(40);
    });
  });

  describe('Authorization header variations', () => {
    it('should reject lowercase bearer token', async () => {
      const response = await request.get(API_PREFIX).set({
        ...DEFAULT_HEADERS,
        Authorization: `bearer ${authToken}`,
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code');
    });

    it('should accept token without Bearer prefix', async () => {
      // The server accepts tokens with or without Bearer prefix for flexibility
      const response = await request.get(API_PREFIX).set({
        ...DEFAULT_HEADERS,
        Authorization: authToken,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
    });

    it('should reject empty Bearer token', async () => {
      const response = await request.get(API_PREFIX).set({
        ...DEFAULT_HEADERS,
        Authorization: 'Bearer',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code');
    });
  });
});
