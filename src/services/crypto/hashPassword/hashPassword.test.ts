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
    it('should hash a valid password', async () => {
      const password = 'validPassword123';
      const hashed = await service.hash(password);

      expect(hashed).toBeDefined();
      expect(hashed.length).toBeGreaterThan(0);
      expect(await service.verify({ password: password, hash: hashed, logger: mockLogger })).toBe(true);
    });

    it('should throw error for empty password', async () => {
      await expect(service.hash('')).rejects.toThrow('Invalid password');
    });

    it('should throw error for non-string password', async () => {
      // @ts-expect-error Testing invalid input
      await expect(service.hash(null)).rejects.toThrow('Invalid password');
      // @ts-expect-error Testing invalid input
      await expect(service.hash(undefined)).rejects.toThrow('Invalid password');
      // @ts-expect-error Testing invalid input
      await expect(service.hash(123)).rejects.toThrow('Invalid password');
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
