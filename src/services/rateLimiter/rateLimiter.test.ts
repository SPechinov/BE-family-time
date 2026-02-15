import { RateLimiterService } from './rateLimiter';
import { ErrorTooManyRequests } from '@/pkg';

describe('RateLimiterService', () => {
  let service: RateLimiterService;
  let mockRedis: any;

  const mockConfig = {
    maxAttempts: 5,
    window: 60000, // 60 seconds
    prefix: 'test-prefix',
  };

  beforeEach(() => {
    mockRedis = {
      hmGet: jest.fn(),
      multi: jest.fn().mockReturnThis(),
      hIncrBy: jest.fn().mockReturnThis(),
      hSet: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    service = new RateLimiterService({
      redis: mockRedis,
      ...mockConfig,
    });

    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct config', () => {
      const customService = new RateLimiterService({
        redis: mockRedis,
        maxAttempts: 10,
        window: 120000,
        prefix: 'custom-prefix',
      });

      expect(customService).toBeDefined();
    });

    it('should throw if props is not provided', () => {
      // @ts-expect-error Testing invalid type for validation
      expect(() => new RateLimiterService(undefined)).toThrow('Props object is required');
    });

    it('should throw if redis is not provided', () => {
      expect(
        () =>
          new RateLimiterService({
            // @ts-expect-error Testing invalid type for validation
            redis: undefined,
            maxAttempts: 5,
            window: 60000,
            prefix: 'test',
          }),
      ).toThrow('Redis client is required');
    });

    it('should throw if maxAttempts is not a number', () => {
      expect(
        () =>
          new RateLimiterService({
            redis: mockRedis,
            // @ts-expect-error Testing invalid type for validation
            maxAttempts: '5',
            window: 60000,
            prefix: 'test',
          }),
      ).toThrow('maxAttempts must be a number');
    });

    it('should throw if window is not a number', () => {
      expect(
        () =>
          new RateLimiterService({
            redis: mockRedis,
            maxAttempts: 5,
            // @ts-expect-error Testing invalid type for validation
            window: '60000',
            prefix: 'test',
          }),
      ).toThrow('window must be a number');
    });

    it('should throw if prefix is not a string', () => {
      expect(
        () =>
          new RateLimiterService({
            redis: mockRedis,
            maxAttempts: 5,
            window: 60000,
            // @ts-expect-error Testing invalid type for validation
            prefix: 123,
          }),
      ).toThrow('prefix must be a string');
    });

    it('should throw if maxAttempts is less than 1', () => {
      expect(
        () =>
          new RateLimiterService({
            redis: mockRedis,
            maxAttempts: 0,
            window: 60000,
            prefix: 'test',
          }),
      ).toThrow('maxAttempts should be greater than 0');
    });

    it('should throw if window is less than 1', () => {
      expect(
        () =>
          new RateLimiterService({
            redis: mockRedis,
            maxAttempts: 5,
            window: 0,
            prefix: 'test',
          }),
      ).toThrow('window should be greater than 0');
    });

    it('should throw if prefix is empty', () => {
      expect(
        () =>
          new RateLimiterService({
            redis: mockRedis,
            maxAttempts: 5,
            window: 60000,
            prefix: '',
          }),
      ).toThrow('prefix cannot be empty');
    });

    it('should throw if onceInInterval is not a number when provided', () => {
      expect(
        () =>
          new RateLimiterService({
            redis: mockRedis,
            maxAttempts: 5,
            window: 60000,
            prefix: 'test',
            // @ts-expect-error Testing invalid type for validation
            onceInInterval: '1000',
          }),
      ).toThrow('onceInInterval must be a number if provided');
    });

    it('should throw if onceInInterval is less than 1', () => {
      expect(
        () =>
          new RateLimiterService({
            redis: mockRedis,
            maxAttempts: 5,
            window: 60000,
            prefix: 'test',
            onceInInterval: 0,
          }),
      ).toThrow('onceInInterval should be greater than 0');
    });

    it('should throw if onceInInterval is greater than window', () => {
      expect(
        () =>
          new RateLimiterService({
            redis: mockRedis,
            maxAttempts: 5,
            window: 60000,
            prefix: 'test',
            onceInInterval: 70000,
          }),
      ).toThrow('onceInInterval should be smaller than window');
    });

    it('should initialize with onceInInterval when valid', () => {
      const service = new RateLimiterService({
        redis: mockRedis,
        maxAttempts: 5,
        window: 60000,
        prefix: 'test',
        onceInInterval: 10000,
      });

      expect(service).toBeDefined();
    });
  });

  describe('checkLimitOrThrow', () => {
    const validKey = 'user123';

    it('should allow request when no previous attempts', async () => {
      mockRedis.hmGet.mockResolvedValue([undefined, undefined]);
      mockRedis.exec.mockResolvedValue([]);

      await expect(service.checkLimitOrThrow({ key: validKey })).resolves.not.toThrow();

      expect(mockRedis.hmGet).toHaveBeenCalledWith(`rate-limit:${mockConfig.prefix}:${validKey}`, [
        'attempts',
        'lastTime',
      ]);
      expect(mockRedis.multi).toHaveBeenCalled();
      expect(mockRedis.hIncrBy).toHaveBeenCalledWith(`rate-limit:${mockConfig.prefix}:${validKey}`, 'attempts', 1);
      expect(mockRedis.hSet).toHaveBeenCalledWith(
        `rate-limit:${mockConfig.prefix}:${validKey}`,
        'lastTime',
        expect.any(Number),
      );
      expect(mockRedis.expire).toHaveBeenCalledWith(`rate-limit:${mockConfig.prefix}:${validKey}`, 60);
      expect(mockRedis.exec).toHaveBeenCalled();
    });

    it('should throw ErrorTooManyRequests when attempts exceed maxAttempts', async () => {
      mockRedis.hmGet.mockResolvedValue(['5', '1000']);

      await expect(service.checkLimitOrThrow({ key: validKey })).rejects.toThrow(ErrorTooManyRequests);

      expect(mockRedis.hmGet).toHaveBeenCalledWith(`rate-limit:${mockConfig.prefix}:${validKey}`, [
        'attempts',
        'lastTime',
      ]);
      expect(mockRedis.multi).not.toHaveBeenCalled();
    });

    it('should throw ErrorTooManyRequests when within onceInInterval', async () => {
      const serviceWithInterval = new RateLimiterService({
        redis: mockRedis,
        maxAttempts: 5,
        window: 60000,
        prefix: 'test',
        onceInInterval: 10000,
      });

      const currentTime = Date.now();
      const lastTime = currentTime - 5000; // within 10s interval

      mockRedis.hmGet.mockResolvedValue(['2', lastTime.toString()]);

      await expect(serviceWithInterval.checkLimitOrThrow({ key: validKey })).rejects.toThrow(ErrorTooManyRequests);

      expect(mockRedis.hmGet).toHaveBeenCalledWith(`rate-limit:test:${validKey}`, ['attempts', 'lastTime']);
      expect(mockRedis.multi).not.toHaveBeenCalled();
    });

    it('should allow request when outside onceInInterval', async () => {
      const serviceWithInterval = new RateLimiterService({
        redis: mockRedis,
        maxAttempts: 5,
        window: 60000,
        prefix: 'test',
        onceInInterval: 10000,
      });

      const currentTime = Date.now();
      const lastTime = (currentTime - 15000) / 1000;

      mockRedis.hmGet.mockResolvedValue(['2', lastTime.toString()]);
      mockRedis.exec.mockResolvedValue([]);

      await expect(serviceWithInterval.checkLimitOrThrow({ key: validKey })).resolves.not.toThrow();

      expect(mockRedis.hmGet).toHaveBeenCalledWith(`rate-limit:test:${validKey}`, ['attempts', 'lastTime']);
      expect(mockRedis.multi).toHaveBeenCalled();
      expect(mockRedis.hIncrBy).toHaveBeenCalledWith(`rate-limit:test:${validKey}`, 'attempts', 1);
      expect(mockRedis.hSet).toHaveBeenCalledWith(`rate-limit:test:${validKey}`, 'lastTime', expect.any(Number));
      expect(mockRedis.expire).toHaveBeenCalledWith(`rate-limit:test:${validKey}`, 60);
      expect(mockRedis.exec).toHaveBeenCalled();
    });

    it('should handle different keys correctly', async () => {
      const key1 = 'user1';
      const key2 = 'user2';

      mockRedis.hmGet.mockResolvedValue([undefined, undefined]);
      mockRedis.exec.mockResolvedValue([]);

      await expect(service.checkLimitOrThrow({ key: key1 })).resolves.not.toThrow();
      await expect(service.checkLimitOrThrow({ key: key2 })).resolves.not.toThrow();

      expect(mockRedis.hmGet).toHaveBeenCalledTimes(2);
      expect(mockRedis.hmGet).toHaveBeenCalledWith(`rate-limit:${mockConfig.prefix}:${key1}`, ['attempts', 'lastTime']);
      expect(mockRedis.hmGet).toHaveBeenCalledWith(`rate-limit:${mockConfig.prefix}:${key2}`, ['attempts', 'lastTime']);
    });

    it('should use correct Redis key format', async () => {
      const customService = new RateLimiterService({
        redis: mockRedis,
        maxAttempts: 5,
        window: 60000,
        prefix: 'custom',
      });

      mockRedis.hmGet.mockResolvedValue([undefined, undefined]);
      mockRedis.exec.mockResolvedValue([]);

      await customService.checkLimitOrThrow({ key: 'test' });

      expect(mockRedis.hmGet).toHaveBeenCalledWith('rate-limit:custom:test', ['attempts', 'lastTime']);
    });

    it('should normalize time correctly', async () => {
      mockRedis.hmGet.mockResolvedValue([undefined, undefined]);
      mockRedis.exec.mockResolvedValue([]);

      const now = Date.now();
      const expectedTime = Math.floor(now / 1000);

      await service.checkLimitOrThrow({ key: validKey });

      expect(mockRedis.hSet).toHaveBeenCalledWith(
        `rate-limit:${mockConfig.prefix}:${validKey}`,
        'lastTime',
        expectedTime,
      );
      expect(mockRedis.expire).toHaveBeenCalledWith(`rate-limit:${mockConfig.prefix}:${validKey}`, 60);
    });
  });
});
