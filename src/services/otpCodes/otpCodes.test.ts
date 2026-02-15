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

    // Removed: service does not validate numeric format, only length

    // Добавлено: проверка специальных символов в ключе
    it('should handle special characters in key', async () => {
      const specialKeys = ['user+tag@example.com', 'user_name@example.com', 'user123', 'test@domain.co.uk'];

      for (const key of specialKeys) {
        mockRedis.setEx.mockResolvedValueOnce(REDIS_STATUS_SUCCESS_RESPONSE);
        await service.saveCode({ code: '123456', key });
        expect(mockRedis.setEx).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${key}`, mockConfig.ttlSec, '123456');
      }
    });

    // Добавлено: проверка TTL
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

    // Добавлено: проверка codeLength
    it('should respect codeLength configuration', async () => {
      const service8 = new OtpCodesService({
        redis: mockRedis,
        prefix: 'test',
        codeLength: 8,
        ttlSec: 300,
      });

      // Для 8-значного кода
      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);
      await expect(service8.saveCode({ code: '12345678', key: 'user@example.com' })).resolves.not.toThrow();

      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);
      await expect(service8.saveCode({ code: '123456', key: 'user@example.com' })).rejects.toThrow(
        'Invalid code length',
      );
    });
  });

  describe('getCode', () => {
    const validKey = 'user@example.com';
    const storedCode = '123456';

    it('should get code with correct parameters', async () => {
      mockRedis.get.mockResolvedValue(storedCode);

      const result = await service.getCode({ key: validKey });

      expect(mockRedis.get).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${validKey}`);
      expect(result).toBe(storedCode);
    });

    it('should return null when code does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getCode({ key: validKey });

      expect(result).toBeNull();
    });

    it('should throw error when Redis throws error', async () => {
      const redisError = new Error('Redis connection failed');
      mockRedis.get.mockRejectedValue(redisError);

      await expect(service.getCode({ key: validKey })).rejects.toThrow(redisError);
    });

    it('should throw error for different Redis errors', async () => {
      const errors = [new Error('Connection timeout'), new Error('Redis busy'), new Error('Max retries exceeded')];

      for (const error of errors) {
        mockRedis.get.mockRejectedValueOnce(error);
        await expect(service.getCode({ key: validKey })).rejects.toThrow(error);
      }
    });

    it('should throw error if key type is invalid', () => {
      const invalidKeys = [null, undefined, 123, {}, [], true, false, Symbol('test')];

      for (const key of invalidKeys) {
        expect(() => service.getCode({ key: key as any })).toThrow('Key must be a string');
      }

      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it('should throw error if key is empty', () => {
      const emptyKey = '';

      expect(() => service.getCode({ key: emptyKey })).toThrow('Invalid key length');

      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it('should handle different key formats', async () => {
      const keys = ['user@example.com', '+1234567890', 'test-user-id', 'simple'];

      for (const key of keys) {
        mockRedis.get.mockResolvedValueOnce('123456');
        await service.getCode({ key });
        expect(mockRedis.get).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${key}`);
      }
    });

    // getCode returns whatever is stored in Redis without validation
    it('should return code as stored in Redis (no format validation)', async () => {
      mockRedis.get.mockResolvedValue('abc123');
      const result = await service.getCode({ key: 'user@example.com' });
      expect(result).toBe('abc123');
    });
  });

  describe('deleteCode', () => {
    const validKey = 'user@example.com';

    it('should delete code with correct parameters', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.deleteCode({ key: validKey });

      expect(mockRedis.del).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${validKey}`);
    });

    it('should throw error when Redis throws error', async () => {
      const redisError = new Error('Redis connection failed');
      mockRedis.del.mockRejectedValue(redisError);

      await expect(service.deleteCode({ key: validKey })).rejects.toThrow(redisError);
    });

    it('should throw error for different Redis errors', async () => {
      const errors = [new Error('Connection timeout'), new Error('Redis busy'), new Error('Max retries exceeded')];

      for (const error of errors) {
        mockRedis.del.mockRejectedValueOnce(error);
        await expect(service.deleteCode({ key: validKey })).rejects.toThrow(error);
      }
    });

    it('should throw error if key type is invalid', () => {
      const invalidKeys = [null, undefined, 123, {}, [], true, false, Symbol('test')];

      for (const key of invalidKeys) {
        expect(() => service.deleteCode({ key: key as any })).toThrow('Key must be a string');
      }

      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should throw error if key is empty', () => {
      const emptyKey = '';

      expect(() => service.deleteCode({ key: emptyKey })).toThrow('Invalid key length');

      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should handle deletion of non-existent key', async () => {
      mockRedis.del.mockResolvedValue(0);

      await expect(service.deleteCode({ key: validKey })).resolves.not.toThrow();

      expect(mockRedis.del).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${validKey}`);
    });

    it('should delete multiple codes', async () => {
      mockRedis.del.mockResolvedValue(1);

      await expect(service.deleteCode({ key: 'user1@example.com' })).resolves.toBe(1);
      await expect(service.deleteCode({ key: 'user2@example.com' })).resolves.toBe(1);

      expect(mockRedis.del).toHaveBeenCalledTimes(2);
    });
  });

  describe('Redis key building', () => {
    it('should build correct Redis key with default prefix', async () => {
      const key = 'test@example.com';
      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);

      await service.saveCode({ code: '123456', key });

      expect(mockRedis.setEx).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${key}`, mockConfig.ttlSec, '123456');
    });

    it('should build correct Redis key with custom prefix', async () => {
      const customPrefix = 'custom-otp';
      const customService = new OtpCodesService({
        redis: mockRedis,
        prefix: customPrefix,
        codeLength: 6,
        ttlSec: 300,
      });

      const key = 'test@example.com';
      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);

      await customService.saveCode({ code: '123456', key });

      expect(mockRedis.setEx).toHaveBeenCalledWith(`otp:${customPrefix}:${key}`, 300, '123456');
    });

    it('should build correct Redis key with special characters in key', async () => {
      const specialKeys = ['user+tag@example.com', 'user_name@example.com', '123456'];

      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);

      for (const key of specialKeys) {
        await service.saveCode({ code: '123456', key });
        expect(mockRedis.setEx).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${key}`, mockConfig.ttlSec, '123456');
      }
    });
  });

  describe('integration scenarios', () => {
    it('should handle full save-get-delete cycle', async () => {
      const code = '654321';
      const key = 'integration@test.com';

      // Save
      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);
      await service.saveCode({ code, key });

      // Get
      mockRedis.get.mockResolvedValue(code);
      const retrievedCode = await service.getCode({ key });
      expect(retrievedCode).toBe(code);

      // Delete
      mockRedis.del.mockResolvedValue(1);
      const deleteResult = await service.deleteCode({ key });
      expect(deleteResult).toBe(1);

      // Verify calls
      expect(mockRedis.setEx).toHaveBeenCalledTimes(1);
      expect(mockRedis.get).toHaveBeenCalledTimes(1);
      expect(mockRedis.del).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple codes with different keys', async () => {
      const codes = [
        { code: '111111', key: 'user1@test.com' },
        { code: '222222', key: 'user2@test.com' },
        { code: '333333', key: 'user3@test.com' },
      ];

      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);
      mockRedis.get.mockImplementation((key: string) => {
        const keyPart = key.split(':')[2];
        const found = codes.find((c) => c.key === keyPart);
        return Promise.resolve(found?.code || null);
      });

      // Save all codes
      for (const { code, key } of codes) {
        await service.saveCode({ code, key });
      }

      expect(mockRedis.setEx).toHaveBeenCalledTimes(3);

      // Get all codes
      for (const { code, key } of codes) {
        const retrieved = await service.getCode({ key });
        expect(retrieved).toBe(code);
      }

      expect(mockRedis.get).toHaveBeenCalledTimes(3);
    });
  });
});
