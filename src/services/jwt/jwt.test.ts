import jwt from 'jsonwebtoken';
import { JwtService } from './jwt';

jest.mock('jsonwebtoken');
jest.mock('@/config', () => ({
  CONFIG: {
    jwt: {
      accessTokenSecret: 'access-token-secret',
      refreshTokenSecret: 'refresh-token-secret',
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
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
        expiresIn: '15m',
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
        expiresIn: '7d',
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

    it('should return null for invalid access token', () => {
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
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

    it('should return null for invalid refresh token', () => {
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const result = service.verifyRefreshToken(token);

      expect(result).toBeNull();
    });
  });
});
