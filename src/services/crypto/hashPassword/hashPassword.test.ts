import { HashPasswordService } from './hashPassword';
import argon2 from 'argon2';
import { ILogger } from '@/pkg';

describe('HashPasswordService', () => {
  let service: HashPasswordService;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    service = new HashPasswordService();
    // @ts-expect-error - Partial implementation
    mockLogger = {
      error: jest.fn(),
    };
  });

  describe('hash', () => {
    const validPassword = 'validPassword123';

    it('should hash a valid password', async () => {
      const hashed = await service.hash(validPassword);

      expect(hashed).toBeDefined();
      expect(hashed.length).toBeGreaterThan(0);
      expect(await service.verify({ password: validPassword, hash: hashed, logger: mockLogger })).toBe(true);
    });

    describe('invalid inputs', () => {
      const invalidTypeMessage = 'Invalid password';

      it('should throw if password is empty', async () => {
        await expect(service.hash('')).rejects.toThrow(invalidTypeMessage);
      });

      const expectInvalidInput = async (input: unknown) => {
        await expect((service as any).hash(input)).rejects.toThrow('Invalid password');
      };

      it('should throw if password is null', async () => {
        await expectInvalidInput(null);
      });

      it('should throw if password is undefined', async () => {
        await expectInvalidInput(undefined);
      });

      it('should throw if password is number', async () => {
        await expectInvalidInput(123);
      });

      it('should throw if password is object', async () => {
        await expectInvalidInput({});
      });

      it('should throw if password is array', async () => {
        await expectInvalidInput([]);
      });
    });
  });

  describe('verify', () => {
    const password = 'validPassword123';
    let hashedPassword: string;

    beforeEach(async () => {
      hashedPassword = await service.hash(password);
    });

    it('should return true for correct password', async () => {
      const result = await service.verify({
        password: password,
        hash: hashedPassword,
        logger: mockLogger,
      });

      expect(result).toBe(true);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return false for incorrect password', async () => {
      const result = await service.verify({
        password: 'wrongPassword',
        hash: hashedPassword,
        logger: mockLogger,
      });

      expect(result).toBe(false);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return false and log error when verification fails', async () => {
      const error = new Error('Verification failed');
      jest.spyOn(argon2, 'verify').mockImplementationOnce(() => {
        throw error;
      });

      const result = await service.verify({
        password: password,
        hash: hashedPassword,
        logger: mockLogger,
      });

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith({ error });
    });

    it('should throw error if plain password is invalid', async () => {
      await expect(
        service.verify({
          password: '',
          hash: hashedPassword,
          logger: mockLogger,
        }),
      ).rejects.toThrow('Invalid password');
    });

    it('should throw error if hashed password is invalid', async () => {
      await expect(
        service.verify({
          password: password,
          hash: '',
          logger: mockLogger,
        }),
      ).rejects.toThrow('Invalid password');
    });
  });
});
