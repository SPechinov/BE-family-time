import jwt from 'jsonwebtoken';
import { JwtService } from './jwt';

jest.mock('jsonwebtoken');
jest.mock('@/config', () => ({
  CONFIG: {
    jwt: {
      accessTokenSecret: 'access-token-secret',
      refreshTokenSecret: 'refresh-token-secret',
      accessTokenExpiry: 900000,
      refreshTokenExpiry: 604800000,
      issuer: 'family-time-app',
    },
  },
}));

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(() => {
    service = new JwtService();
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    const payload = { userId: 'user-123' };

    it('should generate access token with correct payload and options', () => {
      const expectedToken = 'access-token';
      (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

      const result = service.generateAccessToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, 'access-token-secret', {
        expiresIn: 900,
        issuer: 'family-time-app',
      });
      expect(result).toBe(expectedToken);
    });

    it('should generate token with different userId', () => {
      const payload = { userId: 'another-user-456' };
      const expectedToken = 'another-access-token';
      (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

      const result = service.generateAccessToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, 'access-token-secret', {
        expiresIn: 900,
        issuer: 'family-time-app',
      });
      expect(result).toBe(expectedToken);
    });
  });

  describe('generateRefreshToken', () => {
    const payload = { userId: 'user-123' };

    it('should generate refresh token with correct payload and options', () => {
      const expectedToken = 'refresh-token';
      (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

      const result = service.generateRefreshToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, 'refresh-token-secret', {
        expiresIn: 604800,
        issuer: 'family-time-app',
      });
      expect(result).toBe(expectedToken);
    });

    it('should generate refresh token with different userId', () => {
      const payload = { userId: 'another-user-789' };
      const expectedToken = 'another-refresh-token';
      (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

      const result = service.generateRefreshToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, 'refresh-token-secret', {
        expiresIn: 604800,
        issuer: 'family-time-app',
      });
      expect(result).toBe(expectedToken);
    });
  });

  describe('verifyAccessToken', () => {
    const token = 'valid-access-token';
    const payload = { userId: 'user-123' };

    it('should verify valid access token and return payload', () => {
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const result = service.verifyAccessToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, 'access-token-secret');
      expect(result).toEqual(payload);
    });

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

  describe('verifyRefreshToken', () => {
    const token = 'valid-refresh-token';
    const payload = { userId: 'user-123' };

    it('should verify valid refresh token and return payload', () => {
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const result = service.verifyRefreshToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, 'refresh-token-secret');
      expect(result).toEqual(payload);
    });

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

  describe('issuer validation', () => {
    it('should include issuer in access token generation', () => {
      const payload = { userId: 'user-123' };
      (jwt.sign as jest.Mock).mockReturnValue('token');

      service.generateAccessToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'access-token-secret',
        expect.objectContaining({
          issuer: 'family-time-app',
        }),
      );
    });

    it('should include issuer in refresh token generation', () => {
      const payload = { userId: 'user-123' };
      (jwt.sign as jest.Mock).mockReturnValue('token');

      service.generateRefreshToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'refresh-token-secret',
        expect.objectContaining({
          issuer: 'family-time-app',
        }),
      );
    });
  });

  describe('token expiry', () => {
    it('should use correct expiry time for access token', () => {
      const payload = { userId: 'user-123' };
      (jwt.sign as jest.Mock).mockReturnValue('token');

      service.generateAccessToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'access-token-secret',
        expect.objectContaining({
          expiresIn: 900,
        }),
      );
    });

    it('should use correct expiry time for refresh token', () => {
      const payload = { userId: 'user-123' };
      (jwt.sign as jest.Mock).mockReturnValue('token');

      service.generateRefreshToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'refresh-token-secret',
        expect.objectContaining({
          expiresIn: 604800,
        }),
      );
    });
  });

  describe('parseToken', () => {
    const token = 'valid-token';
    const payload = { userId: 'user-123' };

    it('should parse valid token and return payload', () => {
      (jwt.decode as jest.Mock).mockReturnValue(payload);

      const result = service.parseToken(token);

      expect(jwt.decode).toHaveBeenCalledWith(token);
      expect(result).toEqual(payload);
    });

    it('should return null for invalid token', () => {
      (jwt.decode as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const result = service.parseToken(token);

      expect(result).toBeNull();
    });

    it('should return null for malformed token', () => {
      (jwt.decode as jest.Mock).mockReturnValueOnce(null);

      const result = service.parseToken(token);

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
  });
});
