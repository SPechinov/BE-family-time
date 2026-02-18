import jwt from 'jsonwebtoken';
import { JwtService } from './jwt';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

jest.mock('jsonwebtoken');
jest.mock('@/config', () => ({
  CONFIG: {
    jwt: {
      accessTokenSecret: 'access-token-secret',
      refreshTokenSecret: 'refresh-token-secret',
      accessTokenExpiry: 900000, // 15 minutes
      refreshTokenExpiry: 604800000, // 7 days
      issuer: 'family-time-app',
    },
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const createMockToken = (value: string) => value;
const createMockPayload = (userId: string) => ({ userId });

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(() => {
    service = new JwtService();
    jest.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // generateAccessToken()
  // ───────────────────────────────────────────────────────────────────────────

  describe('generateAccessToken()', () => {
    describe('✓ Valid operations', () => {
      it('should generate access token with correct payload and options', () => {
        const payload = createMockPayload('user-123');
        const expectedToken = createMockToken('access-token');
        (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

        const result = service.generateAccessToken(payload);

        expect(jwt.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-123',
            createdAt: expect.any(String),
          }),
          'access-token-secret',
          {
            expiresIn: 900,
            issuer: 'family-time-app',
          },
        );
        expect(result).toBe(expectedToken);
      });

      it('should generate token with different userId', () => {
        const payload = createMockPayload('another-user-456');
        const expectedToken = createMockToken('another-access-token');
        (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

        const result = service.generateAccessToken(payload);

        expect(jwt.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'another-user-456',
            createdAt: expect.any(String),
          }),
          'access-token-secret',
          {
            expiresIn: 900,
            issuer: 'family-time-app',
          },
        );
        expect(result).toBe(expectedToken);
      });

      it('should include createdAt timestamp in payload', () => {
        const payload = createMockPayload('user-123');
        (jwt.sign as jest.Mock).mockReturnValue('token');

        service.generateAccessToken(payload);

        expect(jwt.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            createdAt: expect.any(String),
          }),
          expect.anything(),
          expect.anything(),
        );
      });
    });

    describe('🔐 Token properties', () => {
      it('should use correct expiry time for access token', () => {
        const payload = createMockPayload('user-123');
        (jwt.sign as jest.Mock).mockReturnValue('token');

        service.generateAccessToken(payload);

        expect(jwt.sign).toHaveBeenCalledWith(
          expect.anything(),
          'access-token-secret',
          expect.objectContaining({
            expiresIn: 900, // 15 minutes in seconds
          }),
        );
      });

      it('should include issuer in access token generation', () => {
        const payload = createMockPayload('user-123');
        (jwt.sign as jest.Mock).mockReturnValue('token');

        service.generateAccessToken(payload);

        expect(jwt.sign).toHaveBeenCalledWith(
          expect.anything(),
          'access-token-secret',
          expect.objectContaining({
            issuer: 'family-time-app',
          }),
        );
      });

      it('should preserve additional payload properties', () => {
        const payload = { userId: 'user-123', role: 'admin', email: 'user@example.com' };
        (jwt.sign as jest.Mock).mockReturnValue('token');

        service.generateAccessToken(payload);

        expect(jwt.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-123',
            role: 'admin',
            email: 'user@example.com',
          }),
          expect.anything(),
          expect.anything(),
        );
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // generateRefreshToken()
  // ───────────────────────────────────────────────────────────────────────────

  describe('generateRefreshToken()', () => {
    describe('✓ Valid operations', () => {
      it('should generate refresh token with correct payload and options', () => {
        const payload = createMockPayload('user-123');
        const expectedToken = createMockToken('refresh-token');
        (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

        const result = service.generateRefreshToken(payload);

        expect(jwt.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-123',
            createdAt: expect.any(String),
          }),
          'refresh-token-secret',
          {
            expiresIn: 604800,
            issuer: 'family-time-app',
          },
        );
        expect(result).toBe(expectedToken);
      });

      it('should generate refresh token with different userId', () => {
        const payload = createMockPayload('another-user-789');
        const expectedToken = createMockToken('another-refresh-token');
        (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

        const result = service.generateRefreshToken(payload);

        expect(jwt.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'another-user-789',
            createdAt: expect.any(String),
          }),
          'refresh-token-secret',
          {
            expiresIn: 604800,
            issuer: 'family-time-app',
          },
        );
        expect(result).toBe(expectedToken);
      });
    });

    describe('🔐 Token properties', () => {
      it('should use correct expiry time for refresh token', () => {
        const payload = createMockPayload('user-123');
        (jwt.sign as jest.Mock).mockReturnValue('token');

        service.generateRefreshToken(payload);

        expect(jwt.sign).toHaveBeenCalledWith(
          expect.anything(),
          'refresh-token-secret',
          expect.objectContaining({
            expiresIn: 604800, // 7 days in seconds
          }),
        );
      });

      it('should include issuer in refresh token generation', () => {
        const payload = createMockPayload('user-123');
        (jwt.sign as jest.Mock).mockReturnValue('token');

        service.generateRefreshToken(payload);

        expect(jwt.sign).toHaveBeenCalledWith(
          expect.anything(),
          'refresh-token-secret',
          expect.objectContaining({
            issuer: 'family-time-app',
          }),
        );
      });

      it('should have longer expiry than access token', () => {
        (jwt.sign as jest.Mock).mockReturnValue('token');

        service.generateAccessToken({ userId: 'user-123' });
        service.generateRefreshToken({ userId: 'user-123' });

        const accessCall = (jwt.sign as jest.Mock).mock.calls.find((call) => call[2]?.expiresIn === 900);
        const refreshCall = (jwt.sign as jest.Mock).mock.calls.find((call) => call[2]?.expiresIn === 604800);

        expect(accessCall).toBeDefined();
        expect(refreshCall).toBeDefined();
        expect(refreshCall![2]!.expiresIn).toBeGreaterThan(accessCall![2]!.expiresIn);
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // verifyAccessToken()
  // ───────────────────────────────────────────────────────────────────────────

  describe('verifyAccessToken()', () => {
    const token = createMockToken('valid-access-token');
    const payload = createMockPayload('user-123');

    describe('✓ Valid operations', () => {
      it('should verify valid access token and return payload', () => {
        (jwt.verify as jest.Mock).mockReturnValue(payload);

        const result = service.verifyAccessToken(token);

        expect(jwt.verify).toHaveBeenCalledWith(token, 'access-token-secret');
        expect(result).toEqual(payload);
      });
    });

    describe('✗ Invalid tokens', () => {
      it('should return null for expired access token', () => {
        const expiredError = new jwt.TokenExpiredError('jwt expired', new Date());
        (jwt.verify as jest.Mock).mockImplementationOnce(() => {
          throw expiredError;
        });

        const result = service.verifyAccessToken(token);

        expect(result).toBeNull();
      });

      it('should return null for malformed access token', () => {
        const malformedError = new jwt.JsonWebTokenError('jwt malformed');
        (jwt.verify as jest.Mock).mockImplementationOnce(() => {
          throw malformedError;
        });

        const result = service.verifyAccessToken(token);

        expect(result).toBeNull();
      });

      it('should return null for access token with invalid signature', () => {
        const invalidSignatureError = new jwt.JsonWebTokenError('invalid signature');
        (jwt.verify as jest.Mock).mockImplementationOnce(() => {
          throw invalidSignatureError;
        });

        const result = service.verifyAccessToken(token);

        expect(result).toBeNull();
      });

      it('should return null for access token used before not-before time', () => {
        const notBeforeError = new jwt.NotBeforeError('jwt not active', new Date());
        (jwt.verify as jest.Mock).mockImplementationOnce(() => {
          throw notBeforeError;
        });

        const result = service.verifyAccessToken(token);

        expect(result).toBeNull();
      });

      it('should return null for generic error when verifying access token', () => {
        (jwt.verify as jest.Mock).mockImplementationOnce(() => {
          throw new Error('Unknown error');
        });

        const result = service.verifyAccessToken(token);

        expect(result).toBeNull();
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // verifyRefreshToken()
  // ───────────────────────────────────────────────────────────────────────────

  describe('verifyRefreshToken()', () => {
    const token = createMockToken('valid-refresh-token');
    const payload = createMockPayload('user-123');

    describe('✓ Valid operations', () => {
      it('should verify valid refresh token and return payload', () => {
        (jwt.verify as jest.Mock).mockReturnValue(payload);

        const result = service.verifyRefreshToken(token);

        expect(jwt.verify).toHaveBeenCalledWith(token, 'refresh-token-secret');
        expect(result).toEqual(payload);
      });
    });

    describe('✗ Invalid tokens', () => {
      it('should return null for expired refresh token', () => {
        const expiredError = new jwt.TokenExpiredError('jwt expired', new Date());
        (jwt.verify as jest.Mock).mockImplementationOnce(() => {
          throw expiredError;
        });

        const result = service.verifyRefreshToken(token);

        expect(result).toBeNull();
      });

      it('should return null for malformed refresh token', () => {
        const malformedError = new jwt.JsonWebTokenError('jwt malformed');
        (jwt.verify as jest.Mock).mockImplementationOnce(() => {
          throw malformedError;
        });

        const result = service.verifyRefreshToken(token);

        expect(result).toBeNull();
      });

      it('should return null for refresh token with invalid signature', () => {
        const invalidSignatureError = new jwt.JsonWebTokenError('invalid signature');
        (jwt.verify as jest.Mock).mockImplementationOnce(() => {
          throw invalidSignatureError;
        });

        const result = service.verifyRefreshToken(token);

        expect(result).toBeNull();
      });

      it('should return null for refresh token used before not-before time', () => {
        const notBeforeError = new jwt.NotBeforeError('jwt not active', new Date());
        (jwt.verify as jest.Mock).mockImplementationOnce(() => {
          throw notBeforeError;
        });

        const result = service.verifyRefreshToken(token);

        expect(result).toBeNull();
      });

      it('should return null for generic error when verifying refresh token', () => {
        (jwt.verify as jest.Mock).mockImplementationOnce(() => {
          throw new Error('Unknown error');
        });

        const result = service.verifyRefreshToken(token);

        expect(result).toBeNull();
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // parseToken()
  // ───────────────────────────────────────────────────────────────────────────

  describe('parseToken()', () => {
    describe('✓ Valid operations', () => {
      it('should parse valid token and return payload', () => {
        const token = createMockToken('valid-token');
        const payload = createMockPayload('user-123');
        (jwt.decode as jest.Mock).mockReturnValue(payload);

        const result = service.parseToken(token);

        expect(jwt.decode).toHaveBeenCalledWith(token);
        expect(result).toEqual(payload);
      });

      it('should parse token with multiple claims', () => {
        const token = createMockToken('multi-claim-token');
        const payload = {
          userId: 'user-123',
          role: 'admin',
          email: 'user@example.com',
          iat: 1234567890,
          exp: 1234567990,
        };
        (jwt.decode as jest.Mock).mockReturnValue(payload);

        const result = service.parseToken(token);

        expect(result).toEqual(payload);
      });
    });

    describe('✗ Invalid tokens', () => {
      it('should return null for invalid token', () => {
        (jwt.decode as jest.Mock).mockImplementationOnce(() => {
          throw new Error('Invalid token');
        });

        const result = service.parseToken('invalid-token');

        expect(result).toBeNull();
      });

      it('should return null for malformed token', () => {
        (jwt.decode as jest.Mock).mockReturnValueOnce(null);

        const result = service.parseToken('malformed-token');

        expect(result).toBeNull();
      });

      it('should return null for null token', () => {
        (jwt.decode as jest.Mock).mockReturnValueOnce(null);

        const result = service.parseToken(null as any);

        expect(jwt.decode).toHaveBeenCalledWith(null);
        expect(result).toBeNull();
      });

      it('should return null for empty token', () => {
        (jwt.decode as jest.Mock).mockReturnValueOnce(null);

        const result = service.parseToken('');

        expect(jwt.decode).toHaveBeenCalledWith('');
        expect(result).toBeNull();
      });

      it('should return null for token with only header', () => {
        (jwt.decode as jest.Mock).mockReturnValueOnce(null);

        const result = service.parseToken('eyJhbGciOiJIUzI1NiJ9');

        expect(result).toBeNull();
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Integration tests
  // ───────────────────────────────────────────────────────────────────────────

  describe('Integration', () => {
    describe('✓ Token lifecycle', () => {
      it('should generate and verify access token', () => {
        const payload = createMockPayload('user-123');
        const token = 'generated-access-token';
        const verifiedPayload = { userId: 'user-123', iat: 1234567890 };

        (jwt.sign as jest.Mock).mockReturnValue(token);
        (jwt.verify as jest.Mock).mockReturnValue(verifiedPayload);

        const generated = service.generateAccessToken(payload);
        const verified = service.verifyAccessToken(generated);

        expect(generated).toBe(token);
        expect(verified).toEqual(verifiedPayload);
      });

      it('should generate and verify refresh token', () => {
        const payload = createMockPayload('user-123');
        const token = 'generated-refresh-token';
        const verifiedPayload = { userId: 'user-123', iat: 1234567890 };

        (jwt.sign as jest.Mock).mockReturnValue(token);
        (jwt.verify as jest.Mock).mockReturnValue(verifiedPayload);

        const generated = service.generateRefreshToken(payload);
        const verified = service.verifyRefreshToken(generated);

        expect(generated).toBe(token);
        expect(verified).toEqual(verifiedPayload);
      });

      it('should parse token after generation', () => {
        const payload = createMockPayload('user-123');
        const token = 'generated-token';
        const decodedPayload = { userId: 'user-123', exp: 1234567990 };

        (jwt.sign as jest.Mock).mockReturnValue(token);
        (jwt.decode as jest.Mock).mockReturnValue(decodedPayload);

        const generated = service.generateAccessToken(payload);
        const parsed = service.parseToken(generated);

        expect(generated).toBe(token);
        expect(parsed).toEqual(decodedPayload);
      });
    });

    describe('🔐 Security', () => {
      it('should use different secrets for access and refresh tokens', () => {
        (jwt.sign as jest.Mock).mockReturnValue('token');

        service.generateAccessToken({ userId: 'user-123' });
        service.generateRefreshToken({ userId: 'user-123' });

        const accessCall = (jwt.sign as jest.Mock).mock.calls.find((call) => call[1] === 'access-token-secret');
        const refreshCall = (jwt.sign as jest.Mock).mock.calls.find((call) => call[1] === 'refresh-token-secret');

        expect(accessCall).toBeDefined();
        expect(refreshCall).toBeDefined();
        expect(accessCall![1]).not.toBe(refreshCall![1]);
      });

      it('should not verify token with wrong secret', () => {
        const token = 'test-token';

        (jwt.verify as jest.Mock).mockImplementationOnce(() => {
          throw new jwt.JsonWebTokenError('invalid signature');
        });

        const result = service.verifyAccessToken(token);

        expect(result).toBeNull();
        expect(jwt.verify).toHaveBeenCalledWith(token, 'access-token-secret');
      });

      it('should handle token with missing userId gracefully', () => {
        const token = 'test-token';
        const payloadWithoutUserId = { role: 'admin' };

        (jwt.verify as jest.Mock).mockReturnValue(payloadWithoutUserId);

        const result = service.verifyAccessToken(token);

        expect(result).toEqual(payloadWithoutUserId);
      });
    });

    describe('⚡ Performance', () => {
      it('should generate multiple tokens quickly', () => {
        (jwt.sign as jest.Mock).mockReturnValue('token');

        const startTime = Date.now();

        for (let i = 0; i < 100; i++) {
          service.generateAccessToken({ userId: `user-${i}` });
        }

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(100);
      });

      it('should verify multiple tokens quickly', () => {
        (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-123' });

        const startTime = Date.now();

        for (let i = 0; i < 100; i++) {
          service.verifyAccessToken('token');
        }

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(100);
      });
    });
  });
});
