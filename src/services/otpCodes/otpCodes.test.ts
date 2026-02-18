import { OtpCodesService } from './otpCodes';
import { REDIS_STATUS_SUCCESS_RESPONSE } from '@/pkg/redis';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const invalidTypes = [
  { name: 'null', value: null },
  { name: 'undefined', value: undefined },
  { name: 'number', value: 123 },
  { name: 'object', value: {} },
  { name: 'array', value: [] },
  { name: 'boolean (true)', value: true },
  { name: 'boolean (false)', value: false },
  { name: 'symbol', value: Symbol('test') },
];

const createMockRedis = () => ({
  setEx: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('OtpCodesService', () => {
  let service: OtpCodesService;
  let mockRedis: ReturnType<typeof createMockRedis>;

  const mockConfig = {
    prefix: 'auth-test-otp',
    codeLength: 6,
    ttlSec: 300,
  };

  beforeEach(() => {
    mockRedis = createMockRedis();
    service = new OtpCodesService({
      // @ts-expect-error - Mocked Redis client
      redis: mockRedis,
      ...mockConfig,
    });
    jest.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // constructor
  // ───────────────────────────────────────────────────────────────────────────

  describe('constructor', () => {
    describe('✓ Valid config', () => {
      it('should initialize with correct config', () => {
        const customService = new OtpCodesService({
          // @ts-expect-error - Mocked Redis client
          redis: mockRedis,
          prefix: 'custom-prefix',
          codeLength: 8,
          ttlSec: 600,
        });

        expect(customService).toBeDefined();
      });

      it('should accept minimal config values', () => {
        const minimalService = new OtpCodesService({
          // @ts-expect-error - Mocked Redis client
          redis: mockRedis,
          prefix: 'a',
          codeLength: 1,
          ttlSec: 1,
        });

        expect(minimalService).toBeDefined();
      });

      it('should accept large config values', () => {
        const largeService = new OtpCodesService({
          // @ts-expect-error - Mocked Redis client
          redis: mockRedis,
          prefix: 'a'.repeat(100),
          codeLength: 100,
          ttlSec: 86400, // 24 hours
        });

        expect(largeService).toBeDefined();
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // saveCode()
  // ───────────────────────────────────────────────────────────────────────────

  describe('saveCode()', () => {
    const validCode = '123456';
    const validKey = 'user@example.com';

    describe('✓ Valid operations', () => {
      it('should save code with correct parameters', async () => {
        mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);

        await service.saveCode({ code: validCode, key: validKey });

        expect(mockRedis.setEx).toHaveBeenCalledWith(
          `otp:${mockConfig.prefix}:${validKey}`,
          mockConfig.ttlSec,
          validCode,
        );
      });

      it('should handle different key formats', async () => {
        const keys = ['+1234567890', 'user@example.com', 'user-id-12345', 'test@domain.co.uk'];

        for (const key of keys) {
          mockRedis.setEx.mockResolvedValueOnce(REDIS_STATUS_SUCCESS_RESPONSE);
          await service.saveCode({ code: validCode, key });

          expect(mockRedis.setEx).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${key}`, mockConfig.ttlSec, validCode);
        }
      });

      it('should handle different code values', async () => {
        const codes = ['111111', '999999', '000000', '123123'];

        for (const code of codes) {
          mockRedis.setEx.mockResolvedValueOnce(REDIS_STATUS_SUCCESS_RESPONSE);
          await service.saveCode({ code, key: validKey });

          expect(mockRedis.setEx).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${validKey}`, mockConfig.ttlSec, code);
        }
      });

      it('should handle special characters in key', async () => {
        const specialKeys = [
          'user+tag@example.com',
          'user_name@example.com',
          'user.name@example.com',
          'test@domain.co.uk',
        ];

        for (const key of specialKeys) {
          mockRedis.setEx.mockResolvedValueOnce(REDIS_STATUS_SUCCESS_RESPONSE);
          await service.saveCode({ code: validCode, key });

          expect(mockRedis.setEx).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${key}`, mockConfig.ttlSec, validCode);
        }
      });

      it('should use correct TTL when saving code', async () => {
        const customService = new OtpCodesService({
          // @ts-expect-error - Mocked Redis client
          redis: mockRedis,
          prefix: 'test',
          codeLength: 6,
          ttlSec: 600,
        });

        mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);
        await customService.saveCode({ code: validCode, key: validKey });

        expect(mockRedis.setEx).toHaveBeenCalledWith('otp:test:user@example.com', 600, validCode);
      });
    });

    describe('✗ Invalid code', () => {
      it('should throw if code length is too short', async () => {
        const shortCode = '123';

        await expect(service.saveCode({ code: shortCode, key: validKey })).rejects.toThrow('Invalid code length');

        expect(mockRedis.setEx).not.toHaveBeenCalled();
      });

      it('should throw if code length is too long', async () => {
        const longCode = '1234567';

        await expect(service.saveCode({ code: longCode, key: validKey })).rejects.toThrow('Invalid code length');

        expect(mockRedis.setEx).not.toHaveBeenCalled();
      });

      it('should throw if code is empty', async () => {
        await expect(service.saveCode({ code: '', key: validKey })).rejects.toThrow('Invalid code length');

        expect(mockRedis.setEx).not.toHaveBeenCalled();
      });

      it('should accept non-numeric characters (only length is validated)', async () => {
        mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);

        await expect(service.saveCode({ code: 'abcdef', key: validKey })).resolves.not.toThrow();
        await expect(service.saveCode({ code: '12a45b', key: validKey })).resolves.not.toThrow();

        expect(mockRedis.setEx).toHaveBeenCalledTimes(2);
      });
    });

    describe('✗ Invalid code types', () => {
      it.each(invalidTypes)('should throw for $name', async ({ value }) => {
        await expect(service.saveCode({ code: value as any, key: validKey })).rejects.toThrow('Code must be a string');

        expect(mockRedis.setEx).not.toHaveBeenCalled();
      });
    });

    describe('✗ Invalid key', () => {
      it('should throw if key is empty', async () => {
        await expect(service.saveCode({ code: validCode, key: '' })).rejects.toThrow('Invalid key length');

        expect(mockRedis.setEx).not.toHaveBeenCalled();
      });
    });

    describe('✗ Invalid key types', () => {
      it.each(invalidTypes)('should throw for $name', async ({ value }) => {
        await expect(service.saveCode({ code: validCode, key: value as any })).rejects.toThrow('Key must be a string');

        expect(mockRedis.setEx).not.toHaveBeenCalled();
      });
    });

    describe('✗ Redis errors', () => {
      it('should throw if Redis returns non-OK status', async () => {
        mockRedis.setEx.mockResolvedValue('ERROR');

        await expect(service.saveCode({ code: validCode, key: validKey })).rejects.toThrow('Failed to save code');

        expect(mockRedis.setEx).toHaveBeenCalledTimes(1);
      });

      it('should throw if Redis throws exception', async () => {
        const redisError = new Error('Redis connection failed');
        mockRedis.setEx.mockRejectedValue(redisError);

        await expect(service.saveCode({ code: validCode, key: validKey })).rejects.toThrow(redisError);

        expect(mockRedis.setEx).toHaveBeenCalledTimes(1);
      });

      it('should propagate Redis error with details', async () => {
        const detailedError = new Error('Connection refused: ECONNREFUSED');
        mockRedis.setEx.mockRejectedValue(detailedError);

        await expect(service.saveCode({ code: validCode, key: validKey })).rejects.toThrow(
          'Connection refused: ECONNREFUSED',
        );
      });
    });

    describe('🔑 Key format variations', () => {
      it('should handle email keys with various formats', async () => {
        const emails = [
          'simple@example.com',
          'with.dots@example.com',
          'with+plus@example.com',
          'with_underscore@example.com',
          'with-dash@example.com',
        ];

        for (const email of emails) {
          mockRedis.setEx.mockResolvedValueOnce(REDIS_STATUS_SUCCESS_RESPONSE);
          await service.saveCode({ code: validCode, key: email });

          expect(mockRedis.setEx).toHaveBeenCalledWith(
            `otp:${mockConfig.prefix}:${email}`,
            mockConfig.ttlSec,
            validCode,
          );
        }
      });

      it('should handle phone number keys', async () => {
        const phones = ['+1234567890', '+7 (999) 123-45-67', '89991234567', '+44 20 7946 0958'];

        for (const phone of phones) {
          mockRedis.setEx.mockResolvedValueOnce(REDIS_STATUS_SUCCESS_RESPONSE);
          await service.saveCode({ code: validCode, key: phone });

          expect(mockRedis.setEx).toHaveBeenCalledWith(
            `otp:${mockConfig.prefix}:${phone}`,
            mockConfig.ttlSec,
            validCode,
          );
        }
      });

      it('should handle UUID keys', async () => {
        const uuids = ['550e8400-e29b-41d4-a716-446655440000', '123e4567-e89b-12d3-a456-426614174000'];

        for (const uuid of uuids) {
          mockRedis.setEx.mockResolvedValueOnce(REDIS_STATUS_SUCCESS_RESPONSE);
          await service.saveCode({ code: validCode, key: uuid });

          expect(mockRedis.setEx).toHaveBeenCalledWith(
            `otp:${mockConfig.prefix}:${uuid}`,
            mockConfig.ttlSec,
            validCode,
          );
        }
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // getCode()
  // ───────────────────────────────────────────────────────────────────────────

  describe('getCode()', () => {
    const validKey = 'user@example.com';

    describe('✓ Valid operations', () => {
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

      it('should return undefined when code is not set', async () => {
        mockRedis.get.mockResolvedValue(undefined);

        const result = await service.getCode({ key: validKey });

        expect(result).toBeUndefined();
      });
    });

    describe('✗ Invalid key', () => {
      it('should throw if key is empty', async () => {
        await expect(() => service.getCode({ key: '' })).toThrow('Invalid key length');
        expect(mockRedis.get).not.toHaveBeenCalled();
      });
    });

    describe('✗ Invalid key types', () => {
      it.each(invalidTypes)('should throw for $name', async ({ value }) => {
        await expect(() => service.getCode({ key: value as any })).toThrow();
        expect(mockRedis.get).not.toHaveBeenCalled();
      });
    });

    describe('🔑 Key format variations', () => {
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
  });

  // ───────────────────────────────────────────────────────────────────────────
  // deleteCode()
  // ───────────────────────────────────────────────────────────────────────────

  describe('deleteCode()', () => {
    const validKey = 'user@example.com';

    describe('✓ Valid operations', () => {
      it('should delete code with correct key', async () => {
        mockRedis.del.mockResolvedValue(1);

        const result = await service.deleteCode({ key: validKey });

        expect(result).toBe(1);
        expect(mockRedis.del).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${validKey}`);
      });

      it('should return 0 when code does not exist', async () => {
        mockRedis.del.mockResolvedValue(0);

        const result = await service.deleteCode({ key: validKey });

        expect(result).toBe(0);
        expect(mockRedis.del).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${validKey}`);
      });

      it('should return count of deleted keys', async () => {
        mockRedis.del.mockResolvedValue(2);

        const result = await service.deleteCode({ key: validKey });

        expect(result).toBe(2);
      });
    });

    describe('✗ Invalid key', () => {
      it('should throw if key is empty', async () => {
        await expect(() => service.deleteCode({ key: '' })).toThrow('Invalid key length');
        expect(mockRedis.del).not.toHaveBeenCalled();
      });
    });

    describe('✗ Invalid key types', () => {
      it.each(invalidTypes)('should throw for $name', async ({ value }) => {
        await expect(() => service.deleteCode({ key: value as any })).toThrow();
        expect(mockRedis.del).not.toHaveBeenCalled();
      });
    });

    describe('🔑 Key format variations', () => {
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

  // ───────────────────────────────────────────────────────────────────────────
  // Integration: Full workflow
  // ───────────────────────────────────────────────────────────────────────────

  describe('Integration: Full workflow', () => {
    it('should save, get, and delete code in sequence', async () => {
      const code = '654321';
      const key = 'test@example.com';

      // Save
      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);
      await service.saveCode({ code, key });

      expect(mockRedis.setEx).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${key}`, mockConfig.ttlSec, code);

      // Get
      mockRedis.get.mockResolvedValue(code);
      const retrieved = await service.getCode({ key });

      expect(retrieved).toBe(code);

      // Delete
      mockRedis.del.mockResolvedValue(1);
      const deleted = await service.deleteCode({ key });

      expect(deleted).toBe(1);
    });

    it('should handle get after delete (code not found)', async () => {
      const code = '111222';
      const key = 'delete-test@example.com';

      // Save
      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);
      await service.saveCode({ code, key });

      // Delete
      mockRedis.del.mockResolvedValue(1);
      await service.deleteCode({ key });

      // Get after delete - returns null
      mockRedis.get.mockResolvedValue(null);
      const retrieved = await service.getCode({ key });

      expect(retrieved).toBeNull();
    });

    it('should handle multiple codes for different keys', async () => {
      const codes = [
        { key: 'user1@example.com', code: '111111' },
        { key: 'user2@example.com', code: '222222' },
        { key: 'user3@example.com', code: '333333' },
      ];

      // Save all codes
      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);
      for (const { key, code } of codes) {
        await service.saveCode({ code, key });
      }

      expect(mockRedis.setEx).toHaveBeenCalledTimes(3);

      // Get all codes
      codes.forEach(({ key, code }) => {
        mockRedis.get.mockResolvedValueOnce(code);
      });

      for (const { key, code } of codes) {
        const retrieved = await service.getCode({ key });
        expect(retrieved).toBe(code);
      }
    });

    it('should handle code overwrite (save same key twice)', async () => {
      const key = 'overwrite@example.com';
      const code1 = '111111';
      const code2 = '222222';

      // First save
      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);
      await service.saveCode({ code: code1, key });

      // Second save (overwrite)
      await service.saveCode({ code: code2, key });

      expect(mockRedis.setEx).toHaveBeenCalledTimes(2);

      // Get should return latest code
      mockRedis.get.mockResolvedValue(code2);
      const retrieved = await service.getCode({ key });

      expect(retrieved).toBe(code2);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Key building
  // ───────────────────────────────────────────────────────────────────────────

  describe('Key building', () => {
    it('should build key with correct format', async () => {
      const validCode = '123456';
      const key = 'test-key';
      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);

      await service.saveCode({ code: validCode, key });

      expect(mockRedis.setEx).toHaveBeenCalledWith(`otp:${mockConfig.prefix}:${key}`, mockConfig.ttlSec, validCode);
    });

    it('should use different prefixes for different service instances', async () => {
      const service1 = new OtpCodesService({
        // @ts-expect-error - Mocked Redis client
        redis: mockRedis,
        prefix: 'registration',
        codeLength: 6,
        ttlSec: 300,
      });

      const service2 = new OtpCodesService({
        // @ts-expect-error - Mocked Redis client
        redis: mockRedis,
        prefix: 'password-reset',
        codeLength: 6,
        ttlSec: 300,
      });

      mockRedis.setEx.mockResolvedValue(REDIS_STATUS_SUCCESS_RESPONSE);

      await service1.saveCode({ code: '111111', key: 'user@example.com' });
      await service2.saveCode({ code: '222222', key: 'user@example.com' });

      expect(mockRedis.setEx).toHaveBeenNthCalledWith(1, 'otp:registration:user@example.com', 300, '111111');

      expect(mockRedis.setEx).toHaveBeenNthCalledWith(2, 'otp:password-reset:user@example.com', 300, '222222');
    });
  });
});
