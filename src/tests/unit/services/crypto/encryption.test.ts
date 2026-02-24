import crypto from 'crypto';
import { EncryptionService, derivedKeyCache } from '@/services/crypto/encryption/encryption';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks & Config
// ─────────────────────────────────────────────────────────────────────────────

jest.mock('@/config', () => ({
  CONFIG: {
    salts: {
      cryptoCredentials: 'test-secret-password-for-encryption',
    },
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const invalidTypes = [
  { name: 'null', value: null },
  { name: 'undefined', value: undefined },
  { name: 'number (0)', value: 0 },
  { name: 'number (1)', value: 1 },
  { name: 'empty string', value: '' },
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

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  const salt = 'unique-user-salt-12345678';
  const text = 'Hello, secret world!';

  beforeEach(() => {
    encryptionService = new EncryptionService();
    derivedKeyCache.clear();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // encrypt() & decrypt()
  // ───────────────────────────────────────────────────────────────────────────

  describe('encrypt() & decrypt()', () => {
    describe('✓ Valid operations', () => {
      it('should encrypt and decrypt text correctly', async () => {
        const encrypted = await encryptionService.encrypt(text, salt);
        const decrypted = await encryptionService.decrypt(encrypted, salt);

        expect(decrypted).toBe(text);
      });

      it('should handle long text encryption/decryption', async () => {
        const longText = 'a'.repeat(10000);
        const encrypted = await encryptionService.encrypt(longText, salt);
        const decrypted = await encryptionService.decrypt(encrypted, salt);

        expect(decrypted).toBe(longText);
      });

      it('should handle text with special characters', async () => {
        const specialText = 'Special: !@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~';
        const encrypted = await encryptionService.encrypt(specialText, salt);
        const decrypted = await encryptionService.decrypt(encrypted, salt);

        expect(decrypted).toBe(specialText);
      });

      it('should handle text with unicode characters', async () => {
        const unicodeText = 'Привет мир! 你好世界！🌍🔐';
        const encrypted = await encryptionService.encrypt(unicodeText, salt);
        const decrypted = await encryptionService.decrypt(encrypted, salt);

        expect(decrypted).toBe(unicodeText);
      });

      it('should handle text with newlines and tabs', async () => {
        const multilineText = 'Line 1\nLine 2\r\nLine 3\tTabbed';
        const encrypted = await encryptionService.encrypt(multilineText, salt);
        const decrypted = await encryptionService.decrypt(encrypted, salt);

        expect(decrypted).toBe(multilineText);
      });
    });

    describe('✗ Invalid salt types', () => {
      it.each(invalidTypes)('should throw for $name', async ({ value }) => {
        await expect((encryptionService as any).encrypt(text, value)).rejects.toThrow('Invalid salt');
      });
    });

    describe('✗ Invalid salt values', () => {
      const invalidSalts = [
        { name: 'too short (1 char)', value: 'a' },
        { name: 'too short (7 chars)', value: '1234567' },
        { name: 'exactly 7 chars', value: 'abcdefg' },
      ];

      it.each(invalidSalts)('should throw for $name', async ({ value }) => {
        await expect(encryptionService.encrypt(text, value)).rejects.toThrow('Invalid salt');
      });
    });

    describe('✓ Valid salt boundary', () => {
      it('should accept salt with exactly 8 characters', async () => {
        const validSalt = '12345678';
        const encrypted = await encryptionService.encrypt(text, validSalt);
        const decrypted = await encryptionService.decrypt(encrypted, validSalt);

        expect(decrypted).toBe(text);
      });

      it('should accept salt with special characters', async () => {
        const specialSalt = 'salt!@#$%^';
        const encrypted = await encryptionService.encrypt(text, specialSalt);
        const decrypted = await encryptionService.decrypt(encrypted, specialSalt);

        expect(decrypted).toBe(text);
      });

      it('should accept salt with unicode', async () => {
        const unicodeSalt = 'соль1234';
        const encrypted = await encryptionService.encrypt(text, unicodeSalt);
        const decrypted = await encryptionService.decrypt(encrypted, unicodeSalt);

        expect(decrypted).toBe(text);
      });
    });

    describe('🔐 Encryption uniqueness', () => {
      it('should produce different IVs for same text and salt', async () => {
        const encrypted1 = await encryptionService.encrypt(text, salt);
        const encrypted2 = await encryptionService.encrypt(text, salt);

        const iv1 = encrypted1.split(':')[0];
        const iv2 = encrypted2.split(':')[0];

        expect(iv1).not.toBe(iv2);
      });

      it('should produce different encrypted output for same input', async () => {
        const encrypted1 = await encryptionService.encrypt(text, salt);
        const encrypted2 = await encryptionService.encrypt(text, salt);

        expect(encrypted1).not.toBe(encrypted2);
      });

      it('should produce different encrypted output for different texts', async () => {
        const encrypted1 = await encryptionService.encrypt('text1', salt);
        const encrypted2 = await encryptionService.encrypt('text2', salt);

        expect(encrypted1).not.toBe(encrypted2);
      });

      it('should produce different encrypted output for different salts', async () => {
        const salt2 = 'different-salt-12345678';
        const encrypted1 = await encryptionService.encrypt(text, salt);
        const encrypted2 = await encryptionService.encrypt(text, salt2);

        expect(encrypted1).not.toBe(encrypted2);
      });
    });

    describe('📦 Encrypted format', () => {
      it('should produce format IV:TAG:CIPHERTEXT', async () => {
        const encrypted = await encryptionService.encrypt(text, salt);
        const parts = encrypted.split(':');

        expect(parts).toHaveLength(3);
        expect(parts[0]).toMatch(/^[0-9a-f]+$/); // IV in hex
        expect(parts[1]).toMatch(/^[0-9a-f]+$/); // TAG in hex
        expect(parts[2]).toMatch(/^[0-9a-f]+$/); // Ciphertext in hex
      });

      it('should produce correct IV length (12 bytes = 24 hex chars)', async () => {
        const encrypted = await encryptionService.encrypt(text, salt);
        const iv = encrypted.split(':')[0];

        expect(iv.length).toBe(24);
      });

      it('should produce correct TAG length (16 bytes = 32 hex chars for GCM)', async () => {
        const encrypted = await encryptionService.encrypt(text, salt);
        const tag = encrypted.split(':')[1];

        expect(tag.length).toBe(32);
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // decrypt() validation
  // ───────────────────────────────────────────────────────────────────────────

  describe('decrypt() validation', () => {
    describe('✗ Invalid format', () => {
      const invalidFormats = [
        { name: 'missing parts (only 2)', value: 'a:b' },
        { name: 'too many parts (4)', value: 'a:b:c:d' },
        { name: 'single part', value: 'abc' },
        { name: 'empty string', value: '' },
        { name: 'only colons', value: '::' },
        { name: 'empty first part', value: ':ff:abc' },
        { name: 'empty middle part', value: 'aa::ccc' },
        { name: 'empty last part', value: 'aa:bb:' },
      ];

      it.each(invalidFormats)('should throw for $name', async ({ value }) => {
        await expect(encryptionService.decrypt(value, salt)).rejects.toThrow('Invalid encrypted format');
      });
    });

    describe('✗ Invalid salt', () => {
      it('should throw for salt too short', async () => {
        const encrypted = await encryptionService.encrypt(text, salt);
        const shortSalt = 'short';

        await expect(encryptionService.decrypt(encrypted, shortSalt)).rejects.toThrow('Invalid salt');
      });

      it('should throw for empty salt', async () => {
        const encrypted = await encryptionService.encrypt(text, salt);

        await expect(encryptionService.decrypt(encrypted, '')).rejects.toThrow('Invalid salt');
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Key derivation and caching
  // ───────────────────────────────────────────────────────────────────────────

  describe('Key derivation and caching', () => {
    let scryptSpy: jest.SpyInstance;

    beforeEach(() => {
      scryptSpy = jest.spyOn(crypto, 'scrypt');
    });

    afterEach(() => {
      scryptSpy.mockRestore();
      derivedKeyCache.clear();
    });

    describe('✓ Caching behavior', () => {
      it('should call scrypt only once for repeated encrypt with same salt', async () => {
        await encryptionService.encrypt(text, salt);
        await encryptionService.encrypt(text, salt);

        expect(scryptSpy).toHaveBeenCalledTimes(1);
      });

      it('should call scrypt only once for parallel encrypt calls', async () => {
        await Promise.all([
          encryptionService.encrypt(text, salt),
          encryptionService.encrypt(text, salt),
          encryptionService.encrypt(text, salt),
        ]);

        expect(scryptSpy).toHaveBeenCalledTimes(1);
      });

      it('should call scrypt only once for mixed encrypt/decrypt with same salt', async () => {
        const encrypted = await encryptionService.encrypt(text, salt);
        await encryptionService.decrypt(encrypted, salt);
        await encryptionService.encrypt(text, salt);

        expect(scryptSpy).toHaveBeenCalledTimes(1);
      });

      it('should call scrypt twice for different salts', async () => {
        const salt2 = 'different-salt-12345678';

        await encryptionService.encrypt(text, salt);
        await encryptionService.encrypt(text, salt2);

        expect(scryptSpy).toHaveBeenCalledTimes(2);
      });

      it('should cache key after successful derivation', async () => {
        await encryptionService.encrypt(text, salt);

        expect(derivedKeyCache.get(salt)).toBeDefined();
      });
    });

    describe('✗ Error handling', () => {
      it('should remove key from cache if scrypt fails', async () => {
        scryptSpy.mockImplementationOnce((_, __, ___, callback) => {
          callback(new Error('scrypt failed'), Buffer.from(''));
        });

        await expect(encryptionService.encrypt(text, salt)).rejects.toThrow('scrypt failed');
        expect(derivedKeyCache.get(salt)).toBeUndefined();
      });

      it('should allow retry after scrypt failure', async () => {
        // First call fails
        scryptSpy.mockImplementationOnce((_, __, ___, callback) => {
          callback(new Error('scrypt failed'), Buffer.from(''));
        });

        await expect(encryptionService.encrypt(text, salt)).rejects.toThrow('scrypt failed');

        // Clear cache and restore real scrypt
        derivedKeyCache.clear();
        scryptSpy.mockRestore();

        // Second call should succeed
        const encrypted = await encryptionService.encrypt(text, salt);
        const decrypted = await encryptionService.decrypt(encrypted, salt);

        expect(decrypted).toBe(text);
      });
    });

    describe('⚡ Performance', () => {
      it('should be faster on cached key derivation', async () => {
        // First call - derives key
        const startTime1 = Date.now();
        await encryptionService.encrypt(text, salt);
        const duration1 = Date.now() - startTime1;

        // Second call - uses cached key
        const startTime2 = Date.now();
        await encryptionService.encrypt(text, salt);
        const duration2 = Date.now() - startTime2;

        // Second call should be faster (cached key)
        expect(duration2).toBeLessThan(duration1);
      }, 5000);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Decryption security
  // ───────────────────────────────────────────────────────────────────────────

  describe('Decryption security', () => {
    describe('✗ Tampered data', () => {
      it('should fail to decrypt when ciphertext is tampered', async () => {
        const encrypted = await encryptionService.encrypt(text, salt);
        const parts = encrypted.split(':');
        const tampered = `${parts[0]}:${parts[1]}:xxx${parts[2]}`;

        await expect(encryptionService.decrypt(tampered, salt)).rejects.toThrow('Decryption failed');
      });

      it('should fail to decrypt when IV is tampered', async () => {
        const encrypted = await encryptionService.encrypt(text, salt);
        const parts = encrypted.split(':');
        const tampered = `xxx${parts[0]}:${parts[1]}:${parts[2]}`;

        await expect(encryptionService.decrypt(tampered, salt)).rejects.toThrow();
      });

      it('should fail to decrypt when TAG is tampered', async () => {
        const encrypted = await encryptionService.encrypt(text, salt);
        const parts = encrypted.split(':');
        const tampered = `${parts[0]}:xxx${parts[1]}:${parts[2]}`;

        await expect(encryptionService.decrypt(tampered, salt)).rejects.toThrow();
      });

      it('should fail to decrypt with truncated data', async () => {
        const encrypted = await encryptionService.encrypt(text, salt);
        const truncated = encrypted.slice(0, -10);

        await expect(encryptionService.decrypt(truncated, salt)).rejects.toThrow();
      });
    });

    describe('✗ Wrong salt', () => {
      it('should fail to decrypt with wrong salt', async () => {
        const encrypted = await encryptionService.encrypt(text, salt);
        const wrongSalt = 'wrong-salt-12345678';

        await expect(encryptionService.decrypt(encrypted, wrongSalt)).rejects.toThrow('Decryption failed');
      });

      it('should fail to decrypt with similar but different salt', async () => {
        const encrypted = await encryptionService.encrypt(text, salt);
        const similarSalt = 'unique-user-salt-87654321';

        await expect(encryptionService.decrypt(encrypted, similarSalt)).rejects.toThrow('Decryption failed');
      });
    });

    describe('✓ Integrity verification', () => {
      it('should successfully decrypt after multiple tamper attempts', async () => {
        const encrypted = await encryptionService.encrypt(text, salt);

        // Try tampering - should fail
        const tampered = encrypted + 'xxx';
        await expect(encryptionService.decrypt(tampered, salt)).rejects.toThrow();

        // Original should still work
        const decrypted = await encryptionService.decrypt(encrypted, salt);
        expect(decrypted).toBe(text);
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Integration tests
  // ───────────────────────────────────────────────────────────────────────────

  describe('Integration: encrypt + decrypt', () => {
    const testCases = [
      { name: 'simple text', value: 'Hello World' },
      { name: 'special chars', value: '!@#$%^&*()_+-=[]{}|' },
      { name: 'unicode', value: 'Привет 世界 🌍' },
      { name: 'long text', value: 'a'.repeat(5000) },
      { name: 'json', value: JSON.stringify({ key: 'value', num: 42 }) },
    ];

    it.each(testCases)('should encrypt and decrypt $name', async ({ value }) => {
      const encrypted = await encryptionService.encrypt(value, salt);
      const decrypted = await encryptionService.decrypt(encrypted, salt);

      expect(decrypted).toBe(value);
    });

    it('should work with multiple sequential encrypt/decrypt cycles', async () => {
      let current = text;

      for (let i = 0; i < 5; i++) {
        const encrypted = await encryptionService.encrypt(current, salt);
        current = await encryptionService.decrypt(encrypted, salt);
      }

      expect(current).toBe(text);
    });

    it('should work with multiple different texts same salt', async () => {
      const texts = ['text1', 'text2', 'text3', 'text4', 'text5'];

      for (const t of texts) {
        const encrypted = await encryptionService.encrypt(t, salt);
        const decrypted = await encryptionService.decrypt(encrypted, salt);

        expect(decrypted).toBe(t);
      }
    });

    it('should work with same text different salts', async () => {
      const salts = ['salt-12345678', 'salt-87654321', 'salt-abcdefgh'];

      for (const s of salts) {
        const encrypted = await encryptionService.encrypt(text, s);
        const decrypted = await encryptionService.decrypt(encrypted, s);

        expect(decrypted).toBe(text);
      }
    });
  });
});
