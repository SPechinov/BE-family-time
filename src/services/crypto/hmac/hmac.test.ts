import { HmacService } from './hmac';

describe('HmacService', () => {
  const secret = 'very-secret-salt-that-is-long-enough';
  let service: HmacService;
  const validSalt = 'a-very-long-and-secure-salt-phrase';
  const validSaltSecond = 'a-very-long-and-secure-second-salt-phrase';

  beforeEach(() => {
    service = new HmacService({ salt: secret });
  });

  describe('constructor', () => {
    describe('salt valid', () => {
      it('should accept valid salt', () => {
        expect(() => new HmacService({ salt: validSalt })).not.toThrow();
      });

      it('should accept valid 16 chars salt', () => {
        expect(() => new HmacService({ salt: '1234567890123456' })).not.toThrow();
      });
    });

    describe('salt invalid', () => {
      const invalidLengthMessage = 'Salt must be at least 16 chars';

      const expectInvalidLengthSalt = (salt: string) => {
        expect(() => new HmacService({ salt })).toThrow(invalidLengthMessage);
      };

      it('should throw if salt is empty', () => expectInvalidLengthSalt(''));
      it('should throw if salt is too short', () => expectInvalidLengthSalt('123456789012345'));

      const invalidTypeMessage = 'Salt must be a string';
      const expectInvalidTypeSalt = (salt: unknown) => {
        expect(() => new (HmacService as any)({ salt })).toThrow(invalidTypeMessage);
      };

      it('should throw if salt is null', () => expectInvalidTypeSalt(null));
      it('should throw if salt is undefined', () => expectInvalidTypeSalt(undefined));
      it('should throw if salt is number', () => expectInvalidTypeSalt(123));
      it('should throw if salt is object', () => expectInvalidTypeSalt({}));
      it('should throw if salt is array', () => expectInvalidTypeSalt([]));
      it('should throw if salt is boolean true', () => expectInvalidTypeSalt(true));
      it('should throw if salt is boolean false', () => expectInvalidTypeSalt(false));
      it('should throw if salt is symbol', () => expectInvalidTypeSalt(Symbol('test')));
      it('should throw if salt is function', () => expectInvalidTypeSalt(() => {}));
    });
  });

  describe('hash', () => {
    const validValue = 'some-data-to-sign';

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

    it('should produce different hashes for different salts', () => {
      const service1 = new HmacService({ salt: validSalt });
      const service2 = new HmacService({ salt: validSaltSecond });

      const hash1 = service1.hash(validValue);
      const hash2 = service2.hash(validValue);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = service.hash(validSalt);
      const hash2 = service.hash(validSaltSecond);

      expect(hash1).not.toBe(hash2);
    });

    describe('value invalid', () => {
      const invalidLengthMessage = 'Value must be at least 1 char';

      const expectInvalidLengthValue = (value: string) => {
        expect(() => service.hash(value)).toThrow(invalidLengthMessage);
      };

      it('should throw if value is empty', () => expectInvalidLengthValue(''));

      const invalidTypeMessage = 'Value must be a string';
      const expectInvalidTypeValue = (value: unknown) => {
        expect(() => (service as any).hash(value)).toThrow(invalidTypeMessage);
      };
      it('should throw if value is null', () => expectInvalidTypeValue(null));
      it('should throw if value is undefined', () => expectInvalidTypeValue(undefined));
      it('should throw if value is number', () => expectInvalidTypeValue(123));
      it('should throw if value is object', () => expectInvalidTypeValue({}));
      it('should throw if value is array', () => expectInvalidTypeValue([]));
      it('should throw if value is boolean true', () => expectInvalidTypeValue(true));
      it('should throw if value is boolean false', () => expectInvalidTypeValue(false));
      it('should throw if value is symbol', () => expectInvalidTypeValue(Symbol('test')));
      it('should throw if value is function', () => expectInvalidTypeValue(() => {}));
    });
  });
});
