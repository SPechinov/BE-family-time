import { HashPasswordService } from './hashPassword';
import argon2 from 'argon2';
import { ILogger } from '@/pkg';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const createMockLogger = (): jest.Mocked<ILogger> => ({
  level: 'debug',
  fatal: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  silent: jest.fn(),
  child: jest.fn(),
});

const invalidTypes = [
  { name: 'null', value: null },
  { name: 'undefined', value: undefined },
  { name: 'number', value: 123 },
  { name: 'object', value: {} },
  { name: 'array', value: [] },
  { name: 'boolean (true)', value: true },
  { name: 'boolean (false)', value: false },
  { name: 'symbol', value: Symbol('test') },
  { name: 'function', value: () => {} },
];

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('HashPasswordService', () => {
  let service: HashPasswordService;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    service = new HashPasswordService();
    mockLogger = createMockLogger();
    jest.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // hash()
  // ───────────────────────────────────────────────────────────────────────────

  describe('hash()', () => {
    describe('✓ Valid inputs', () => {
      const validPasswords = [
        { name: 'simple password', value: 'password123' },
        { name: 'password with spaces', value: 'my secret password' },
        { name: 'password with special chars', value: 'P@$$w0rd!#$%^&*()' },
        { name: 'password with unicode', value: 'пароль123' },
        { name: 'password with emojis', value: 'password🔐123' },
        { name: 'very long password', value: 'a'.repeat(1000) },
        { name: 'single character', value: 'a' },
        { name: 'minimum typical length', value: 'abc123' },
      ];

      it.each(validPasswords)('should hash $name', async ({ value }) => {
        const hashed = await service.hash(value);

        expect(hashed).toBeDefined();
        expect(typeof hashed).toBe('string');
        expect(hashed.length).toBeGreaterThan(0);
      });

      it('should produce different hashes for the same password (salt)', async () => {
        const password = 'samePassword123';
        const hash1 = await service.hash(password);
        const hash2 = await service.hash(password);

        expect(hash1).not.toBe(hash2);
      });

      it('should produce hashes with consistent format', async () => {
        const hashed = await service.hash('password123');

        // Argon2 hash format: $argon2id$v=19$m=65536,t=3,p=4$...
        expect(hashed).toMatch(/^\$argon2id\$v=\d+\$m=\d+,t=\d+,p=\d+\$.+\$.+$/);
      });
    });

    describe('✗ Invalid types', () => {
      it.each(invalidTypes)('should throw for $name', async ({ value }) => {
        await expect((service as any).hash(value)).rejects.toThrow('Invalid password');
      });
    });

    describe('✗ Invalid strings', () => {
      const invalidStrings = [{ name: 'empty string', value: '' }];

      it.each(invalidStrings)('should throw for $name', async ({ value }) => {
        await expect(service.hash(value)).rejects.toThrow('Invalid password');
      });

      it('should throw for string with length 0 (explicit validation)', async () => {
        await expect(service.hash('')).rejects.toThrow('Invalid password');
      });
    });

    describe('🔐 Validation branch coverage', () => {
      it('should throw for non-string type (first branch of validation)', async () => {
        await expect((service as any).hash(123)).rejects.toThrow('Invalid password');
      });

      it('should throw for string with length 0 (second branch of validation)', async () => {
        await expect(service.hash('')).rejects.toThrow('Invalid password');
      });

      it('should accept string with length 1 (boundary)', async () => {
        const hashed = await service.hash('a');
        expect(hashed).toBeDefined();
      });

      it('should verify with valid password and hash (happy path)', async () => {
        const password = 'testPassword123';
        const hash = await service.hash(password);

        const result = await service.verify({
          password,
          hash,
          logger: mockLogger,
        });

        expect(result).toBe(true);
        expect(mockLogger.error).not.toHaveBeenCalled();
      });

      it('should return false and log error when argon2.verify throws (catch branch)', async () => {
        const error = new Error('Argon2 internal error');
        jest.spyOn(require('argon2'), 'verify').mockImplementationOnce(() => {
          throw error;
        });

        const result = await service.verify({
          password: 'test',
          hash: 'invalid-hash-format',
          logger: mockLogger,
        });

        expect(result).toBe(false);
        expect(mockLogger.error).toHaveBeenCalledWith({ error });
      });

      it('should validate password in verify method (first branch)', async () => {
        const hash = await service.hash('test');

        await expect(
          service.verify({
            password: 123 as any,
            hash,
            logger: mockLogger,
          }),
        ).rejects.toThrow('Invalid password');
      });

      it('should validate hash in verify method (second branch)', async () => {
        await expect(
          service.verify({
            password: 'test',
            hash: '',
            logger: mockLogger,
          }),
        ).rejects.toThrow('Invalid password');
      });

      it('should validate both password and hash in verify', async () => {
        await expect(
          service.verify({
            password: '' as any,
            hash: '' as any,
            logger: mockLogger,
          }),
        ).rejects.toThrow('Invalid password');
      });
    });

    describe('⚠ Edge cases (allowed by service)', () => {
      const edgeCases = [
        { name: 'whitespace only', value: '   ' },
        { name: 'tabs only', value: '\t\t' },
        { name: 'newlines only', value: '\n\n' },
      ];

      it.each(edgeCases)('should hash $name (service allows it)', async ({ value }) => {
        const hashed = await service.hash(value);

        expect(hashed).toBeDefined();
        expect(typeof hashed).toBe('string');
      });
    });

    describe('⚡ Performance', () => {
      it('should hash password within acceptable time (< 2 seconds)', async () => {
        const password = 'performanceTest123!';
        const startTime = Date.now();

        await service.hash(password);

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(2000);
      }, 3000);

      it('should hash multiple passwords sequentially within reasonable time', async () => {
        const passwords = ['pass1', 'pass2', 'pass3', 'pass4', 'pass5'];
        const startTime = Date.now();

        for (const pwd of passwords) {
          await service.hash(pwd);
        }

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(10000);
      }, 12000);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // verify()
  // ───────────────────────────────────────────────────────────────────────────

  describe('verify()', () => {
    const password = 'validPassword123';
    let hashedPassword: string;

    beforeEach(async () => {
      hashedPassword = await service.hash(password);
    });

    describe('✓ Valid cases', () => {
      it('should return true for correct password', async () => {
        const result = await service.verify({
          password,
          hash: hashedPassword,
          logger: mockLogger,
        });

        expect(result).toBe(true);
        expect(mockLogger.error).not.toHaveBeenCalled();
      });

      it('should verify password with special characters', async () => {
        const specialPassword = 'P@$$w0rd!#$%^&*()🔐';
        const hash = await service.hash(specialPassword);

        const result = await service.verify({
          password: specialPassword,
          hash,
          logger: mockLogger,
        });

        expect(result).toBe(true);
      });

      it('should verify password with unicode', async () => {
        const unicodePassword = 'пароль123';
        const hash = await service.hash(unicodePassword);

        const result = await service.verify({
          password: unicodePassword,
          hash,
          logger: mockLogger,
        });

        expect(result).toBe(true);
      });
    });

    describe('✗ Invalid password', () => {
      it('should return false for incorrect password', async () => {
        const result = await service.verify({
          password: 'wrongPassword',
          hash: hashedPassword,
          logger: mockLogger,
        });

        expect(result).toBe(false);
        expect(mockLogger.error).not.toHaveBeenCalled();
      });

      it('should return false for password with different case', async () => {
        const result = await service.verify({
          password: 'VALIDPASSWORD123',
          hash: hashedPassword,
          logger: mockLogger,
        });

        expect(result).toBe(false);
      });

      it('should return false for password with extra whitespace', async () => {
        const result = await service.verify({
          password: 'validPassword123 ',
          hash: hashedPassword,
          logger: mockLogger,
        });

        expect(result).toBe(false);
      });

      it('should throw for empty password', async () => {
        await expect(
          service.verify({
            password: '',
            hash: hashedPassword,
            logger: mockLogger,
          }),
        ).rejects.toThrow('Invalid password');
      });
    });

    describe('✗ Invalid hash', () => {
      it('should throw for empty hash', async () => {
        await expect(
          service.verify({
            password,
            hash: '',
            logger: mockLogger,
          }),
        ).rejects.toThrow('Invalid password');
      });

      it('should return false for malformed hash', async () => {
        const result = await service.verify({
          password,
          hash: 'not-a-valid-hash',
          logger: mockLogger,
        });

        expect(result).toBe(false);
      });

      it('should return false for hash from different password', async () => {
        const differentHash = await service.hash('differentPassword');

        const result = await service.verify({
          password,
          hash: differentHash,
          logger: mockLogger,
        });

        expect(result).toBe(false);
      });

      it('should return false for truncated hash', async () => {
        const truncatedHash = hashedPassword.slice(0, 20);

        const result = await service.verify({
          password,
          hash: truncatedHash,
          logger: mockLogger,
        });

        expect(result).toBe(false);
      });
    });

    describe('✗ Invalid types', () => {
      const invalidTypes = [
        { name: 'null password', password: null, hash: 'hash' },
        { name: 'undefined password', password: undefined, hash: 'hash' },
        { name: 'number password', password: 123, hash: 'hash' },
        { name: 'null hash', password: 'pass', hash: null },
        { name: 'undefined hash', password: 'pass', hash: undefined },
        { name: 'number hash', password: 'pass', hash: 123 },
      ];

      it.each(invalidTypes)('should throw for $name', async ({ password, hash }) => {
        await expect(
          service.verify({
            password: password as any,
            hash: hash as any,
            logger: mockLogger,
          }),
        ).rejects.toThrow('Invalid password');
      });
    });

    describe('⚠ Error handling', () => {
      it('should log error when argon2.verify throws', async () => {
        const error = new Error('Verification failed');
        jest.spyOn(argon2, 'verify').mockImplementationOnce(() => {
          throw error;
        });

        const result = await service.verify({
          password,
          hash: hashedPassword,
          logger: mockLogger,
        });

        expect(result).toBe(false);
        expect(mockLogger.error).toHaveBeenCalledWith({ error });
      });

      it('should handle argon2.verify returning false without logging error', async () => {
        jest.spyOn(argon2, 'verify').mockResolvedValueOnce(false);

        const result = await service.verify({
          password: 'wrongPassword',
          hash: hashedPassword,
          logger: mockLogger,
        });

        expect(result).toBe(false);
        expect(mockLogger.error).not.toHaveBeenCalled();
      });
    });

    describe('⚡ Performance', () => {
      it('should verify password within acceptable time (< 2 seconds)', async () => {
        const startTime = Date.now();

        await service.verify({
          password,
          hash: hashedPassword,
          logger: mockLogger,
        });

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(2000);
      }, 3000);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Integration: hash + verify
  // ───────────────────────────────────────────────────────────────────────────

  describe('Integration: hash() + verify()', () => {
    it('should verify hashed password successfully', async () => {
      const password = 'integrationTest123!';
      const hash = await service.hash(password);

      const result = await service.verify({
        password,
        hash,
        logger: mockLogger,
      });

      expect(result).toBe(true);
    });

    it('should work with various password formats', async () => {
      const testCases = [
        { name: 'simple', password: 'password123' },
        { name: 'special chars', password: 'P@$$w0rd!' },
        { name: 'unicode', password: 'пароль🔐' },
        { name: 'long', password: 'a'.repeat(500) },
      ];

      for (const { password } of testCases) {
        const hash = await service.hash(password);
        const result = await service.verify({
          password,
          hash,
          logger: mockLogger,
        });

        expect(result).toBe(true);
      }
    });
  });
});
