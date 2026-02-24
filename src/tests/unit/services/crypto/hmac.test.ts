import { HmacService } from '@/services/crypto/hmac/hmac';

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
  { name: 'function', value: () => {} },
];

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('HmacService', () => {
  const secret = 'very-secret-salt-that-is-long-enough';
  let service: HmacService;
  const validSalt = 'a-very-long-and-secure-salt-phrase';
  const validSaltSecond = 'a-very-long-and-secure-second-salt-phrase';
  const validValue = 'some-data-to-sign';

  beforeEach(() => {
    service = new HmacService({ salt: secret });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // constructor
  // ───────────────────────────────────────────────────────────────────────────

  describe('constructor', () => {
    describe('✓ Valid salt', () => {
      it('should accept valid salt', () => {
        expect(() => new HmacService({ salt: validSalt })).not.toThrow();
      });

      it('should accept salt with exactly 16 characters', () => {
        expect(() => new HmacService({ salt: '1234567890123456' })).not.toThrow();
      });

      it('should accept salt longer than 16 characters', () => {
        expect(() => new HmacService({ salt: 'a'.repeat(100) })).not.toThrow();
      });

      it('should accept salt with special characters', () => {
        expect(() => new HmacService({ salt: '!@#$%^&*()_+-=[]{}|' })).not.toThrow();
      });

      it('should accept salt with unicode characters', () => {
        expect(() => new HmacService({ salt: 'пароль1234567890' })).not.toThrow();
      });

      it('should accept salt with spaces', () => {
        expect(() => new HmacService({ salt: 'a'.repeat(15) + ' ' })).not.toThrow();
      });
    });

    describe('✗ Invalid salt length', () => {
      const invalidLengthMessage = 'Salt must be at least 16 chars';

      it('should throw if salt is empty string', () => {
        expect(() => new HmacService({ salt: '' })).toThrow(invalidLengthMessage);
      });

      it('should throw if salt is 1 char', () => {
        expect(() => new HmacService({ salt: 'a' })).toThrow(invalidLengthMessage);
      });

      it('should throw if salt is 15 chars (just below minimum)', () => {
        expect(() => new HmacService({ salt: '123456789012345' })).toThrow(invalidLengthMessage);
      });

      it.each([
        { name: '1 char', value: 'a' },
        { name: '5 chars', value: 'abcde' },
        { name: '10 chars', value: '1234567890' },
        { name: '15 chars', value: '123456789012345' },
      ])('should throw for salt with $name', ({ value }) => {
        expect(() => new HmacService({ salt: value })).toThrow(invalidLengthMessage);
      });
    });

    describe('✗ Invalid salt types', () => {
      const invalidTypeMessage = 'Salt must be a string';

      it.each(invalidTypes)('should throw for $name', async ({ value }) => {
        expect(() => new (HmacService as any)({ salt: value })).toThrow(invalidTypeMessage);
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // hash()
  // ───────────────────────────────────────────────────────────────────────────

  describe('hash()', () => {
    describe('✓ Valid operations', () => {
      it('should return a non-empty hex string', () => {
        const result = service.hash(validValue);

        expect(typeof result).toBe('string');
        expect(result.length).toBe(128);
        expect(result).toMatch(/^[a-f0-9]{128}$/);
      });

      it('should produce the same hash for the same input', () => {
        const hash1 = service.hash(validValue);
        const hash2 = service.hash(validValue);

        expect(hash1).toBe(hash2);
      });

      it('should produce different hashes for different inputs', () => {
        const hash1 = service.hash('input1');
        const hash2 = service.hash('input2');

        expect(hash1).not.toBe(hash2);
      });

      it('should produce different hashes for different salts', () => {
        const service1 = new HmacService({ salt: validSalt });
        const service2 = new HmacService({ salt: validSaltSecond });

        const hash1 = service1.hash(validValue);
        const hash2 = service2.hash(validValue);

        expect(hash1).not.toBe(hash2);
      });
    });

    describe('✓ Various input types', () => {
      const testCases = [
        { name: 'simple text', value: 'Hello World' },
        { name: 'single character', value: 'a' },
        { name: 'numbers as string', value: '123456789' },
        { name: 'special characters', value: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/' },
        { name: 'unicode characters', value: 'Привет мир! 你好世界！🌍' },
        { name: 'whitespace', value: '   spaces   ' },
        { name: 'tabs and newlines', value: 'line1\nline2\ttabbed' },
        { name: 'long string', value: 'a'.repeat(10000) },
        { name: 'json string', value: JSON.stringify({ key: 'value', num: 42 }) },
        { name: 'binary-like', value: '\x00\x01\x02\x03' },
        { name: 'mixed case', value: 'AbCdEfGhIjKlMnOpQrStUvWxYz' },
      ];

      it.each(testCases)('should hash $name', ({ value }) => {
        const result = service.hash(value);

        expect(typeof result).toBe('string');
        expect(result.length).toBe(128);
        expect(result).toMatch(/^[a-f0-9]{128}$/);
      });
    });

    describe('✓ Hash consistency', () => {
      it('should produce consistent hashes across multiple calls', () => {
        const value = 'consistent-test';
        const hashes = Array(10)
          .fill(null)
          .map(() => service.hash(value));

        expect(new Set(hashes).size).toBe(1);
      });

      it('should produce unique hashes for sequential inputs', () => {
        const inputs = ['input1', 'input2', 'input3', 'input4', 'input5'];
        const hashes = inputs.map((input) => service.hash(input));

        const uniqueHashes = new Set(hashes);
        expect(uniqueHashes.size).toBe(inputs.length);
      });

      it('should produce unique hashes for similar inputs', () => {
        const similarInputs = ['password', 'password ', ' password', 'Password', 'PASSWORD'];
        const hashes = similarInputs.map((input) => service.hash(input));

        const uniqueHashes = new Set(hashes);
        expect(uniqueHashes.size).toBe(similarInputs.length);
      });
    });

    describe('🔐 Hash properties', () => {
      it('should produce SHA-512 hash (128 hex chars = 512 bits)', () => {
        const result = service.hash(validValue);

        expect(result.length).toBe(128);
        expect(result).toMatch(/^[a-f0-9]{128}$/);
      });

      it('should produce lowercase hex output', () => {
        const result = service.hash(validValue);

        expect(result).toBe(result.toLowerCase());
        expect(result).toMatch(/^[a-f0-9]+$/);
      });

      it('should produce deterministic output', () => {
        const value = 'deterministic-test';
        const service1 = new HmacService({ salt: secret });
        const service2 = new HmacService({ salt: secret });

        const hash1 = service1.hash(value);
        const hash2 = service2.hash(value);

        expect(hash1).toBe(hash2);
      });
    });

    describe('✗ Invalid value types', () => {
      const invalidTypeMessage = 'Value must be a string';

      it.each(invalidTypes)('should throw for $name', ({ value }) => {
        expect(() => (service as any).hash(value)).toThrow(invalidTypeMessage);
      });
    });

    describe('✗ Invalid value length', () => {
      const invalidLengthMessage = 'Value must be at least 1 char';

      it('should throw if value is empty string', () => {
        expect(() => service.hash('')).toThrow(invalidLengthMessage);
      });

      it('should throw if value is whitespace only (still valid, >0 chars)', () => {
        // Whitespace is valid since length > 0
        const result = service.hash('   ');

        expect(typeof result).toBe('string');
        expect(result.length).toBe(128);
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Integration tests
  // ───────────────────────────────────────────────────────────────────────────

  describe('Integration', () => {
    describe('✓ Multiple services', () => {
      it('should work with multiple service instances', () => {
        const service1 = new HmacService({ salt: 'salt-one-1234567890' });
        const service2 = new HmacService({ salt: 'salt-two-1234567890' });

        const value = 'shared-value';
        const hash1 = service1.hash(value);
        const hash2 = service2.hash(value);

        expect(hash1).not.toBe(hash2);
        expect(hash1.length).toBe(128);
        expect(hash2.length).toBe(128);
      });

      it('should maintain consistency within same instance', () => {
        const service = new HmacService({ salt: secret });
        const value = 'consistency-test';

        const hash1 = service.hash(value);
        const hash2 = service.hash(value);
        const hash3 = service.hash(value);

        expect(hash1).toBe(hash2);
        expect(hash2).toBe(hash3);
      });
    });

    describe('✓ Salt sensitivity', () => {
      it('should produce different hashes with minimally different salts', () => {
        const service1 = new HmacService({ salt: 'a'.repeat(16) });
        const service2 = new HmacService({ salt: 'a'.repeat(15) + 'b' });

        const value = 'test-value';
        const hash1 = service1.hash(value);
        const hash2 = service2.hash(value);

        expect(hash1).not.toBe(hash2);
      });

      it('should produce different hashes with case-different salts', () => {
        const service1 = new HmacService({ salt: 'SecretSalt123456' });
        const service2 = new HmacService({ salt: 'secretsalt123456' });

        const value = 'test-value';
        const hash1 = service1.hash(value);
        const hash2 = service2.hash(value);

        expect(hash1).not.toBe(hash2);
      });
    });

    describe('✓ Input sensitivity', () => {
      it('should produce different hashes for single character difference', () => {
        const hash1 = service.hash('a');
        const hash2 = service.hash('b');

        expect(hash1).not.toBe(hash2);
      });

      it('should produce different hashes for case difference', () => {
        const hash1 = service.hash('Password');
        const hash2 = service.hash('password');

        expect(hash1).not.toBe(hash2);
      });

      it('should produce different hashes for whitespace difference', () => {
        const hash1 = service.hash('password');
        const hash2 = service.hash('password ');
        const hash3 = service.hash(' password');

        expect(hash1).not.toBe(hash2);
        expect(hash1).not.toBe(hash3);
        expect(hash2).not.toBe(hash3);
      });
    });

    describe('⚡ Performance', () => {
      it('should hash quickly (< 100ms for 1000 iterations)', async () => {
        const startTime = Date.now();

        for (let i = 0; i < 1000; i++) {
          service.hash(`value-${i}`);
        }

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(100);
      }, 1000);

      it('should hash long strings efficiently', async () => {
        const longString = 'a'.repeat(100000);
        const startTime = Date.now();

        service.hash(longString);

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(100);
      }, 1000);
    });

    describe('✓ Real-world scenarios', () => {
      it('should hash email addresses', () => {
        const emails = ['user@example.com', 'admin@test.org', 'test.user@domain.co.uk'];

        const hashes = emails.map((email) => service.hash(email));

        hashes.forEach((hash) => {
          expect(hash.length).toBe(128);
          expect(hash).toMatch(/^[a-f0-9]{128}$/);
        });

        // All hashes should be unique
        expect(new Set(hashes).size).toBe(emails.length);
      });

      it('should hash user IDs', () => {
        const userIds = ['user-1', 'user-2', 'user-3', 'uuid-12345'];

        const hashes = userIds.map((id) => service.hash(id));

        hashes.forEach((hash) => {
          expect(hash.length).toBe(128);
        });

        expect(new Set(hashes).size).toBe(userIds.length);
      });

      it('should hash session tokens', () => {
        const tokens = ['session-abc-123', 'session-def-456', 'jwt-token-xyz-789'];

        const hashes = tokens.map((token) => service.hash(token));

        hashes.forEach((hash) => {
          expect(hash.length).toBe(128);
        });

        expect(new Set(hashes).size).toBe(tokens.length);
      });
    });
  });
});
