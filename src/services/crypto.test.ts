import { CryptoService, derivedKeyCache } from '@/services/crypto';
import crypto from 'crypto';

jest.mock('@/config', () => ({
  CONFIG: {
    salts: {
      cryptoCredentials: 'test-secret-password-for-encryption',
    },
  },
}));

describe('CryptoService', () => {
  let cryptoService: CryptoService;
  const salt = 'unique-user-salt-12345678';
  const text = 'Hello, secret world!';

  beforeEach(() => {
    cryptoService = new CryptoService();
    derivedKeyCache.clear();
  });

  describe('encrypt & decrypt', () => {
    it('should encrypt and decrypt text correctly', async () => {
      const encrypted = await cryptoService.encrypt(text, salt);
      const decrypted = await cryptoService.decrypt(encrypted, salt);

      expect(decrypted).toBe(text);
    });

    it('should throw error if salt is null', async () => {
      // @ts-expect-error — testing runtime validation
      await expect(cryptoService.encrypt(text, null)).rejects.toThrow('Invalid salt');
    });

    it('should throw error if salt is undefined', async () => {
      // @ts-expect-error — testing runtime validation
      await expect(cryptoService.encrypt(text, undefined)).rejects.toThrow('Invalid salt');
    });

    it('should throw error if salt is 0', async () => {
      // @ts-expect-error — testing runtime validation
      await expect(cryptoService.encrypt(text, 1)).rejects.toThrow('Invalid salt');
    });

    it('should throw error if salt is 1', async () => {
      // @ts-expect-error — testing runtime validation
      await expect(cryptoService.encrypt(text, 1)).rejects.toThrow('Invalid salt');
    });

    it('should produce different IVs for same text and salt', async () => {
      const encrypted1 = await cryptoService.encrypt(text, salt);
      const encrypted2 = await cryptoService.encrypt(text, salt);

      const iv1 = encrypted1.split(':')[0];
      const iv2 = encrypted2.split(':')[0];

      expect(iv1).not.toBe(iv2);
    });
  });

  describe('validation', () => {
    it('should throw error if salt is too short', async () => {
      await expect(cryptoService.encrypt(text, 'short')).rejects.toThrow('Invalid salt');
    });

    it('should throw error if salt is empty', async () => {
      await expect(cryptoService.encrypt(text, '')).rejects.toThrow('Invalid salt');
    });

    it('should throw error on invalid encrypted format (missing parts)', async () => {
      const broken = 'a:b';
      await expect(cryptoService.decrypt(broken, salt)).rejects.toThrow('Invalid encrypted format');
    });

    it('should throw error on empty encrypted parts', async () => {
      const broken = ':ff:abc';
      await expect(cryptoService.decrypt(broken, salt)).rejects.toThrow('Invalid encrypted format');
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
      await cryptoService.encrypt(text, salt);
      await cryptoService.encrypt(text, salt);

      expect(scryptSpy).toHaveBeenCalledTimes(1);
    });

    it('should call scrypt only once for parallel encrypt calls', async () => {
      await Promise.all([cryptoService.encrypt(text, salt), cryptoService.encrypt(text, salt)]);

      expect(scryptSpy).toHaveBeenCalledTimes(1);
    });

    it('should remove key from cache if scrypt fails', async () => {
      scryptSpy.mockImplementationOnce((_, __, ___, callback) => {
        callback(new Error('scrypt failed'), Buffer.from(''));
      });

      const cache = derivedKeyCache;

      await expect(cryptoService.encrypt(text, salt)).rejects.toThrow('scrypt failed');
      expect(cache.get(salt)).toBeUndefined();
    });
  });

  describe('decryption security', () => {
    it('should fail to decrypt when ciphertext is tampered', async () => {
      const encrypted = await cryptoService.encrypt(text, salt);
      const parts = encrypted.split(':');
      const tampered = `${parts[0]}:${parts[1]}:xxx${parts[2]}`;

      await expect(cryptoService.decrypt(tampered, salt)).rejects.toThrow('Decryption failed');
    });

    it('should fail to decrypt with wrong salt', async () => {
      const encrypted = await cryptoService.encrypt(text, salt);
      const wrongSalt = 'wrong-salt-12345678';

      const promise = cryptoService.decrypt(encrypted, wrongSalt);
      await expect(promise).rejects.toThrow('Decryption failed');
    });
  });
});
