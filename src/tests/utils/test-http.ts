import supertest from 'supertest';
import { FastifyInstance } from 'fastify';

/**
 * Creates a supertest agent for making HTTP requests to Fastify instance
 */
export const createTestAgent = (fastify: FastifyInstance) => {
  return supertest(fastify.server);
};

/**
 * Default headers for API requests
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'test-agent/1.0.0',
};

/**
 * Headers with JWT authorization
 */
export const createAuthHeaders = (token: string) => ({
  ...DEFAULT_HEADERS,
  Authorization: `Bearer ${token}`,
});

/**
 * Extracts cookies from response
 */
export const extractCookies = (response: { headers: { 'set-cookie'?: string[] | string } }): string[] => {
  const setCookie = response.headers['set-cookie'];
  if (!setCookie) return [];
  return Array.isArray(setCookie) ? setCookie : [setCookie];
};

/**
 * Extracts specific cookie by name
 */
export const extractCookie = (
  response: { headers: { 'set-cookie'?: string[] | string } },
  cookieName: string,
): string | null => {
  const cookies = extractCookies(response);
  for (const cookie of cookies) {
    if (cookie.startsWith(`${cookieName}=`)) {
      const match = cookie.match(new RegExp(`${cookieName}=([^;]+)`));
      return match ? match[1] : null;
    }
  }
  return null;
};

/**
 * Extracts authorization token from response headers
 */
export const extractAuthToken = (response: {
  headers: Record<string, string | string[] | undefined>;
}): string | null => {
  // Try different cases for authorization header
  const authHeader =
    response.headers.authorization ||
    response.headers.Authorization ||
    response.headers['authorization'] ||
    response.headers['Authorization'];

  if (Array.isArray(authHeader)) {
    return authHeader[0] ?? null;
  }
  return authHeader ?? null;
};
