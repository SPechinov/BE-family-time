import crypto from 'crypto';
import { EncryptionService, derivedKeyCache } from './encryption';

jest.mock('@/config', () => ({
  CONFIG: {
    salts: {
      cryptoCredentials: 'test-secret-password-for-encryption',
    },
  },
}));

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  const salt = 'unique-user-salt-12345678';
  const text = 'Hello, secret world!';

  beforeEach(() => {
    encryptionService = new EncryptionService();
    derivedKeyCache.clear();
  });

  describe('encrypt & decrypt', () => {
    it('should encrypt and decrypt text correctly', async () => {
      const encrypted = await encryptionService.encrypt(text, salt);
      const decrypted = await encryptionService.decrypt(encrypted, salt);

      expect(decrypted).toBe(text);
    });

    const expectInvalidSalt = async (salt: unknown) => {
      await expect((encryptionService as any).encrypt(text, salt)).rejects.toThrow('Invalid salt');
    };

    it('should throw error if salt is null', async () => {
      await expectInvalidSalt(null);
    });

    it('should throw error if salt is undefined', async () => {
      await expectInvalidSalt(undefined);
    });

    it('should throw error if salt is 0', async () => {
      await expectInvalidSalt(0);
    });

    it('should throw error if salt is 1', async () => {
      await expectInvalidSalt(1);
    });

    it('should throw error if salt is empty string', async () => {
      await expectInvalidSalt('');
    });

    it('should throw error if salt is object', async () => {
      await expectInvalidSalt({});
    });

    it('should throw error if salt is array', async () => {
      await expectInvalidSalt([]);
    });

    it('should throw error if salt is boolean true', async () => {
      await expectInvalidSalt(true);
    });

    it('should throw error if salt is boolean false', async () => {
      await expectInvalidSalt(false);
    });

    it('should throw error if salt is symbol', async () => {
      await expectInvalidSalt(Symbol('test'));
    });

    it('should throw error if salt is function', async () => {
      await expectInvalidSalt(() => {});
    });

    it('should produce different IVs for same text and salt', async () => {
      const encrypted1 = await encryptionService.encrypt(text, salt);
      const encrypted2 = await encryptionService.encrypt(text, salt);

      const iv1 = encrypted1.split(':')[0];
      const iv2 = encrypted2.split(':')[0];

      expect(iv1).not.toBe(iv2);
    });
  });

  describe('validation', () => {
    it('should throw error if salt is too short', async () => {
      await expect(encryptionService.encrypt(text, 'short')).rejects.toThrow('Invalid salt');
    });

    it('should throw error if salt is empty', async () => {
      await expect(encryptionService.encrypt(text, '')).rejects.toThrow('Invalid salt');
    });

    it('should throw error on invalid encrypted format (missing parts)', async () => {
      const broken = 'a:b';
      await expect(encryptionService.decrypt(broken, salt)).rejects.toThrow('Invalid encrypted format');
    });

    it('should throw error on empty encrypted parts', async () => {
      const broken = ':ff:abc';
      await expect(encryptionService.decrypt(broken, salt)).rejects.toThrow('Invalid encrypted format');
    });
  });

  describe('key derivation and caching', () => {
    let scryptSpy: jest.SpyInstance;

    beforeEach(() => {
      scryptSpy = jest.spyOn(crypto, 'scrypt');
    });

    afterEach(() => {
      scryptSpy.mockRestore();
    });

    it('should call scrypt only once for repeated encrypt with same salt', async () => {
      await encryptionService.encrypt(text, salt);
      await encryptionService.encrypt(text, salt);

      expect(scryptSpy).toHaveBeenCalledTimes(1);
    });

    it('should call scrypt only once for parallel encrypt calls', async () => {
      await Promise.all([encryptionService.encrypt(text, salt), encryptionService.encrypt(text, salt)]);

      expect(scryptSpy).toHaveBeenCalledTimes(1);
    });

    it('should remove key from cache if scrypt fails', async () => {
      scryptSpy.mockImplementationOnce((_, __, ___, callback) => {
        callback(new Error('scrypt failed'), Buffer.from(''));
      });

      const cache = derivedKeyCache;

      await expect(encryptionService.encrypt(text, salt)).rejects.toThrow('scrypt failed');
      expect(cache.get(salt)).toBeUndefined();
    });
  });

  describe('decryption security', () => {
    it('should fail to decrypt when ciphertext is tampered', async () => {
      const encrypted = await encryptionService.encrypt(text, salt);
      const parts = encrypted.split(':');
      const tampered = `${parts[0]}:${parts[1]}:xxx${parts[2]}`;

      await expect(encryptionService.decrypt(tampered, salt)).rejects.toThrow('Decryption failed');
    });

    it('should fail to decrypt with wrong salt', async () => {
      const encrypted = await encryptionService.encrypt(text, salt);
      const wrongSalt = 'wrong-salt-12345678';

      const promise = encryptionService.decrypt(encrypted, wrongSalt);
      await expect(promise).rejects.toThrow('Decryption failed');
    });
  });
});
