import { FastifyInstance } from 'fastify';
import { CONFIG } from '@/config';
import { Logger, newPostgresConnection, newRedisConnection } from '@/pkg';
import { newApiRest } from '@/api/rest';
import { randomUUID } from 'node:crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Test Server Configuration
// ─────────────────────────────────────────────────────────────────────────────

interface TestServer {
  fastify: FastifyInstance;
  redis: ReturnType<typeof newRedisConnection> extends Promise<infer T> ? T : never;
  postgres: ReturnType<typeof newPostgresConnection> extends Promise<infer T> ? T : never;
}

let testServer: TestServer | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const generateTestEmail = () => `test-${randomUUID()}@test.com`;
const generateTestPassword = () => 'TestPassword123!@#';
const generateTestFirstName = () => `TestUser-${randomUUID().slice(0, 8)}`;

const createTestUserAgent = () => `TestAgent/1.0 (${randomUUID().slice(0, 8)})`;

// ─────────────────────────────────────────────────────────────────────────────
// Server Setup & Teardown
// ─────────────────────────────────────────────────────────────────────────────

export const setupTestServer = async (): Promise<TestServer> => {
  if (testServer) {
    return testServer;
  }

  const logger = new Logger({
    level: 'silent',
  });

  const redis = await newRedisConnection({
    uri: CONFIG.redis.uri,
    onError: () => {},
    onReady: () => {},
  });

  const postgres = await newPostgresConnection({
    uri: CONFIG.postgres.uri,
    onError: () => {},
    onReady: () => {},
  });

  // Clean database before tests
  await postgres.query('DELETE FROM users WHERE 1=1');

  const fastify = await newApiRest({
    redis,
    postgres,
    logger,
  });

  testServer = { fastify, redis, postgres };
  return testServer;
};

export const teardownTestServer = async (): Promise<void> => {
  if (!testServer) return;

  await testServer.fastify.close();
  testServer.redis.destroy();
  testServer.postgres.end();
  testServer = null;
};

export const cleanDatabase = async (): Promise<void> => {
  if (!testServer) return;
  await testServer.postgres.query('DELETE FROM users WHERE 1=1');
  await testServer.redis.flushDb();
};

// ─────────────────────────────────────────────────────────────────────────────
// API Client Helpers
// ─────────────────────────────────────────────────────────────────────────────

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  otpCode: string;
}

interface Session {
  expiresAt: number;
  userAgent: string | null;
  isCurrent: boolean;
}

export const api = {
  // ───────────────────────────────────────────────────────────────────────────
  // Auth: Login
  // ───────────────────────────────────────────────────────────────────────────

  login: async (props: {
    email: string;
    password: string;
    userAgent?: string;
  }): Promise<{ response: Awaited<ReturnType<FastifyInstance['inject']>>; tokens: LoginResponse }> => {
    const server = await setupTestServer();
    const userAgent = props.userAgent ?? createTestUserAgent();

    const response = await server.fastify.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: {
        'user-agent': userAgent,
        'content-type': 'application/x-www-form-urlencoded',
      },
      payload: new URLSearchParams({
        email: props.email,
        password: props.password,
      }).toString(),
    });

    const accessToken = response.headers.authorization as string;
    const refreshToken = (response.cookies.find((c) => c.name === 'refreshToken')?.value as string) || '';

    return {
      response,
      tokens: { accessToken, refreshToken },
    };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Auth: Registration Start
  // ───────────────────────────────────────────────────────────────────────────

  registrationStart: async (props: {
    email: string;
    userAgent?: string;
  }): Promise<{ response: Awaited<ReturnType<FastifyInstance['inject']>>; otpCode: string }> => {
    const server = await setupTestServer();
    const userAgent = props.userAgent ?? createTestUserAgent();

    const response = await server.fastify.inject({
      method: 'POST',
      url: '/api/auth/registration-start',
      headers: {
        'user-agent': userAgent,
        'content-type': 'application/x-www-form-urlencoded',
      },
      payload: new URLSearchParams({
        email: props.email,
      }).toString(),
    });

    const otpCode = response.headers['x-dev-otp-code'] as string;

    return { response, otpCode };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Auth: Registration End
  // ───────────────────────────────────────────────────────────────────────────

  registrationEnd: async (props: {
    email: string;
    password: string;
    firstName: string;
    otpCode: string;
    userAgent?: string;
  }): Promise<{ response: Awaited<ReturnType<FastifyInstance['inject']>> }> => {
    const server = await setupTestServer();
    const userAgent = props.userAgent ?? createTestUserAgent();

    const response = await server.fastify.inject({
      method: 'POST',
      url: '/api/auth/registration-end',
      headers: {
        'user-agent': userAgent,
        'content-type': 'application/x-www-form-urlencoded',
      },
      payload: new URLSearchParams({
        email: props.email,
        password: props.password,
        firstName: props.firstName,
        otpCode: props.otpCode,
      }).toString(),
    });

    return { response };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Auth: Forgot Password Start
  // ───────────────────────────────────────────────────────────────────────────

  forgotPasswordStart: async (props: {
    email: string;
    userAgent?: string;
  }): Promise<{ response: Awaited<ReturnType<FastifyInstance['inject']>>; otpCode: string }> => {
    const server = await setupTestServer();
    const userAgent = props.userAgent ?? createTestUserAgent();

    const response = await server.fastify.inject({
      method: 'POST',
      url: '/api/auth/forgot-password-start',
      headers: {
        'user-agent': userAgent,
        'content-type': 'application/x-www-form-urlencoded',
      },
      payload: new URLSearchParams({
        email: props.email,
      }).toString(),
    });

    const otpCode = response.headers['x-dev-otp-code'] as string;

    return { response, otpCode };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Auth: Forgot Password End
  // ───────────────────────────────────────────────────────────────────────────

  forgotPasswordEnd: async (props: {
    email: string;
    password: string;
    otpCode: string;
    userAgent?: string;
  }): Promise<{ response: Awaited<ReturnType<FastifyInstance['inject']>> }> => {
    const server = await setupTestServer();
    const userAgent = props.userAgent ?? createTestUserAgent();

    const response = await server.fastify.inject({
      method: 'POST',
      url: '/api/auth/forgot-password-end',
      headers: {
        'user-agent': userAgent,
        'content-type': 'application/x-www-form-urlencoded',
      },
      payload: new URLSearchParams({
        email: props.email,
        password: props.password,
        otpCode: props.otpCode,
      }).toString(),
    });

    return { response };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Auth: Get All Sessions
  // ───────────────────────────────────────────────────────────────────────────

  getAllSessions: async (props: {
    accessToken: string;
    userAgent?: string;
  }): Promise<{ response: Awaited<ReturnType<FastifyInstance['inject']>>; sessions: Session[] }> => {
    const server = await setupTestServer();
    const userAgent = props.userAgent ?? createTestUserAgent();

    const response = await server.fastify.inject({
      method: 'GET',
      url: '/api/auth/get-all-sessions',
      headers: {
        'user-agent': userAgent,
        authorization: `Bearer ${props.accessToken}`,
      },
    });

    const sessions = response.json()?.sessions ?? [];

    return { response, sessions };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Auth: Logout All Sessions
  // ───────────────────────────────────────────────────────────────────────────

  logoutAllSessions: async (props: {
    accessToken: string;
    userAgent?: string;
  }): Promise<{ response: Awaited<ReturnType<FastifyInstance['inject']>> }> => {
    const server = await setupTestServer();
    const userAgent = props.userAgent ?? createTestUserAgent();

    const response = await server.fastify.inject({
      method: 'POST',
      url: '/api/auth/logout-all-sessions',
      headers: {
        'user-agent': userAgent,
        authorization: `Bearer ${props.accessToken}`,
      },
    });

    return { response };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Auth: Logout Session
  // ───────────────────────────────────────────────────────────────────────────

  logoutSession: async (props: {
    accessToken: string;
    userAgent?: string;
  }): Promise<{ response: Awaited<ReturnType<FastifyInstance['inject']>> }> => {
    const server = await setupTestServer();
    const userAgent = props.userAgent ?? createTestUserAgent();

    const response = await server.fastify.inject({
      method: 'POST',
      url: '/api/auth/logout-session',
      headers: {
        'user-agent': userAgent,
        authorization: `Bearer ${props.accessToken}`,
      },
    });

    return { response };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Auth: Refresh Tokens
  // ───────────────────────────────────────────────────────────────────────────

  refreshTokens: async (props: {
    refreshToken: string;
    userAgent?: string;
  }): Promise<{ response: Awaited<ReturnType<FastifyInstance['inject']>>; tokens: LoginResponse }> => {
    const server = await setupTestServer();
    const userAgent = props.userAgent ?? createTestUserAgent();

    const response = await server.fastify.inject({
      method: 'POST',
      url: '/api/auth/refresh-tokens',
      headers: {
        'user-agent': userAgent,
        'content-type': 'application/x-www-form-urlencoded',
      },
      payload: new URLSearchParams({}).toString(),
      cookies: {
        refreshToken: props.refreshToken,
      },
    });

    const accessToken = response.headers.authorization as string;
    const refreshToken = (response.cookies.find((c) => c.name === 'refreshToken')?.value as string) || '';

    return {
      response,
      tokens: { accessToken, refreshToken },
    };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Me: Get Profile
  // ───────────────────────────────────────────────────────────────────────────

  getMe: async (props: {
    accessToken: string;
    userAgent?: string;
  }): Promise<{
    response: Awaited<ReturnType<FastifyInstance['inject']>>;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      createdAt: string;
      updatedAt: string;
    };
  }> => {
    const server = await setupTestServer();
    const userAgent = props.userAgent ?? createTestUserAgent();

    const response = await server.fastify.inject({
      method: 'GET',
      url: '/api/me',
      headers: {
        'user-agent': userAgent,
        authorization: `Bearer ${props.accessToken}`,
      },
    });

    const user = response.json() as any;

    return { response, user };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Test Data Generators
// ─────────────────────────────────────────────────────────────────────────────

export const testData = {
  generateEmail: generateTestEmail,
  generatePassword: generateTestPassword,
  generateFirstName: generateTestFirstName,
  generateUserAgent: createTestUserAgent,

  createRegistrationData: (): RegistrationData => ({
    email: generateTestEmail(),
    password: generateTestPassword(),
    firstName: generateTestFirstName(),
    otpCode: '', // Will be filled from registrationStart
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Full Registration Flow Helper
// ─────────────────────────────────────────────────────────────────────────────

export const completeRegistrationFlow = async (props?: {
  email?: string;
  password?: string;
  firstName?: string;
  userAgent?: string;
}): Promise<{
  email: string;
  password: string;
  firstName: string;
  tokens: LoginResponse;
}> => {
  const email = props?.email ?? testData.generateEmail();
  const password = props?.password ?? testData.generatePassword();
  const firstName = props?.firstName ?? testData.generateFirstName();
  const userAgent = props?.userAgent ?? testData.generateUserAgent();

  // Start registration
  const { otpCode } = await api.registrationStart({ email, userAgent });

  // End registration
  await api.registrationEnd({
    email,
    password,
    firstName,
    otpCode,
    userAgent,
  });

  // Login
  const { tokens } = await api.login({ email, password, userAgent });

  return { email, password, firstName, tokens };
};
