import { OtpCodesService } from './otpCodes';
import { REDIS_STATUS_SUCCESS_RESPONSE } from '@/pkg/redis';

describe('OtpCodesService', () => {
  let service: OtpCodesService;
  let mockRedis: any;

  const mockConfig = {
    prefix: 'auth-test-otp',
    codeLength: 6,
    ttlSec: 300,
  };

  beforeEach(() => {
    mockRedis = {
      setEx: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    service = new OtpCodesService({
      redis: mockRedis,
      ...mockConfig,
    });

    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct config', () => {
      const customService = new OtpCodesService({
        redis: mockRedis,
        prefix: 'custom-prefix',
        codeLength: 8,
        ttlSec: 600,
      });

      expect(customService).toBeDefined();
    });
  });

  describe('saveCode', () => {
    const validCode = '123456';
    const validKey = 'user@example.com';

    it('should save code with correct parameters', async () => {
      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);

      await service.saveCode({ code: validCode, key: validKey });

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        `otp:${mockConfig.prefix}:${validKey}`,
        mockConfig.ttlSec,
        validCode,
      );
    });

    it('should save code with different key', async () => {
      const differentKey = '+1234567890';
      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);

      await service.saveCode({ code: validCode, key: differentKey });

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        `otp:${mockConfig.prefix}:${differentKey}`,
        mockConfig.ttlSec,
        validCode,
      );
    });

    it('should save code with different code', async () => {
      const differentCode = '654321';
      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);

      await service.saveCode({ code: differentCode, key: validKey });

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        `otp:${mockConfig.prefix}:${validKey}`,
        mockConfig.ttlSec,
        differentCode,
      );
    });

    it('should throw error if code length is invalid', async () => {
      const shortCode = '123';
      const longCode = '1234567';

      await expect(service.saveCode({ code: shortCode, key: validKey })).rejects.toThrow('Invalid code length');
      await expect(service.saveCode({ code: longCode, key: validKey })).rejects.toThrow('Invalid code length');

      expect(mockRedis.setEx).not.toHaveBeenCalled();
    });

    it('should save code with non-numeric characters (only length is validated)', async () => {
      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);

      await expect(service.saveCode({ code: 'abcdef', key: validKey })).resolves.not.toThrow();
      await expect(service.saveCode({ code: '12a45b', key: validKey })).resolves.not.toThrow();

      expect(mockRedis.setEx).toHaveBeenCalledTimes(2);
    });

    it('should throw error if code is empty', async () => {
      const emptyCode = '';

      await expect(service.saveCode({ code: emptyCode, key: validKey })).rejects.toThrow('Invalid code length');

      expect(mockRedis.setEx).not.toHaveBeenCalled();
    });

    it('should throw error if code type is invalid', async () => {
      const invalidCodes = [null, undefined, 123456, {}, [], true, false, Symbol('test')];

      for (const code of invalidCodes) {
        await expect(service.saveCode({ code: code as any, key: validKey })).rejects.toThrow('Code must be a string');
      }

      expect(mockRedis.setEx).not.toHaveBeenCalled();
    });

    it('should throw error if key type is invalid', async () => {
      const invalidKeys = [null, undefined, 123, {}, [], true, false, Symbol('test')];

      for (const key of invalidKeys) {
        await expect(service.saveCode({ code: validCode, key: key as any })).rejects.toThrow('Key must be a string');
      }

      expect(mockRedis.setEx).not.toHaveBeenCalled();
    });

    it('should throw error if key is empty', async () => {
      const emptyKey = '';

      await expect(service.saveCode({ code: validCode, key: emptyKey })).rejects.toThrow('Invalid key length');

      expect(mockRedis.setEx).not.toHaveBeenCalled();
    });

    it('should throw error if Redis returns non-OK status', async () => {
      mockRedis.setEx.mockResolvedValue('ERROR');

      await expect(service.saveCode({ code: validCode, key: validKey })).rejects.toThrow('Failed to save code');

      expect(mockRedis.setEx).toHaveBeenCalledTimes(1);
    });

    it('should throw error if Redis throws exception', async () => {
      const redisError = new Error('Redis connection failed');
      mockRedis.setEx.mockRejectedValue(redisError);

      await expect(service.saveCode({ code: validCode, key: validKey })).rejects.toThrow(redisError);

      expect(mockRedis.setEx).toHaveBeenCalledTimes(1);
    });

    it('should handle special characters in key', async () => {
      const specialKeys = ['user+tag@example.com', 'user_name@example.com', 'user123', 'test@domain.co.uk'];

      for (const key of specialKeys) {
        mockRedis.setEx.mockResolvedValueOnce(REDIS_STATUS_SUCCESS_RESPONSE);
        await service.saveCode({ code: '123456', key });
        expect(mockRedis.setEx).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${key}`, mockConfig.ttlSec, '123456');
      }
    });

    it('should use correct TTL when saving code', async () => {
      const customService = new OtpCodesService({
        redis: mockRedis,
        prefix: 'test',
        codeLength: 6,
        ttlSec: 600, // 10 минут
      });

      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);
      await customService.saveCode({ code: '123456', key: 'user@example.com' });

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'otp:test:user@example.com',
        600, // Проверяем TTL
        '123456',
      );
    });
  });

  describe('getCode', () => {
    const validKey = 'user@example.com';

    it('should get code with correct key', async () => {
      const expectedCode = '123456';
      mockRedis.get.mockResolvedValue(expectedCode);

      const result = await service.getCode({ key: validKey });

      expect(result).toBe(expectedCode);
      expect(mockRedis.get).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${validKey}`);
    });

    it('should return null when code does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getCode({ key: validKey });

      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${validKey}`);
    });

    it('should throw error if key type is invalid', async () => {
      const invalidKeys = [null, undefined, 123, {}, [], true, false, Symbol('test')];

      for (const key of invalidKeys) {
        await expect(() => service.getCode({ key: key as any })).toThrow();
        expect(mockRedis.get).not.toHaveBeenCalled();
      }
    });

    it('should throw error if key is empty', async () => {
      const emptyKey = '';

      await expect(() => service.getCode({ key: emptyKey })).toThrow();
      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it('should handle special characters in key', async () => {
      const specialKeys = ['user+tag@example.com', 'user_name@example.com', 'user123', 'test@domain.co.uk'];

      for (const key of specialKeys) {
        mockRedis.get.mockResolvedValueOnce('123456');
        const result = await service.getCode({ key });
        expect(result).toBe('123456');
        expect(mockRedis.get).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${key}`);
      }
    });
  });

  describe('deleteCode', () => {
    const validKey = 'user@example.com';

    it('should delete code with correct key', async () => {
      const deleteCount = 1;
      mockRedis.del.mockResolvedValue(deleteCount);

      const result = await service.deleteCode({ key: validKey });

      expect(result).toBe(deleteCount);
      expect(mockRedis.del).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${validKey}`);
    });

    it('should return 0 when code does not exist', async () => {
      const deleteCount = 0;
      mockRedis.del.mockResolvedValue(deleteCount);

      const result = await service.deleteCode({ key: validKey });

      expect(result).toBe(0);
      expect(mockRedis.del).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${validKey}`);
    });

    it('should throw error if key type is invalid', async () => {
      const invalidKeys = [null, undefined, 123, {}, [], true, false, Symbol('test')];

      for (const key of invalidKeys) {
        await expect(() => service.deleteCode({ key: key as any })).toThrow();
        expect(mockRedis.del).not.toHaveBeenCalled();
      }
    });

    it('should throw error if key is empty', async () => {
      const emptyKey = '';

      await expect(() => service.deleteCode({ key: emptyKey })).toThrow();
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should handle special characters in key', async () => {
      const specialKeys = ['user+tag@example.com', 'user_name@example.com', 'user123', 'test@domain.co.uk'];

      for (const key of specialKeys) {
        mockRedis.del.mockResolvedValueOnce(1);
        const result = await service.deleteCode({ key });
        expect(result).toBe(1);
        expect(mockRedis.del).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${key}`);
      }
    });
  });
});
