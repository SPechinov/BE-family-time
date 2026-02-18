import { RedisClient, TIMES } from '@/pkg';
import { RateLimiterService } from '@/services';
import { IRateLimiterService } from '@/domains/services';

interface CreateAuthRateLimitersProps {
  redis: RedisClient;
}

interface AuthRateLimiters {
  loginRateLimiterService: IRateLimiterService;
  registrationStartRateLimiterService: IRateLimiterService;
  registrationEndRateLimiterService: IRateLimiterService;
  forgotPasswordStartRateLimiterService: IRateLimiterService;
  forgotPasswordEndRateLimiterService: IRateLimiterService;
}

export const createAuthRateLimiters = (props: CreateAuthRateLimitersProps): AuthRateLimiters => {
  const { redis } = props;

  const loginRateLimiterService = new RateLimiterService({
    redis,
    prefix: 'auth-login',
    maxAttempts: 10,
    window: 5 * TIMES.minute,
    onceInInterval: 3 * TIMES.second,
  });

  const registrationStartRateLimiterService = new RateLimiterService({
    redis,
    prefix: 'auth-registration-start-rate-limiter',
    maxAttempts: 5,
    window: 10 * TIMES.minute,
    onceInInterval: 25 * TIMES.second,
  });

  const registrationEndRateLimiterService = new RateLimiterService({
    redis,
    prefix: 'auth-registration-end-rate-limiter',
    maxAttempts: 5,
    window: 10 * TIMES.minute,
    onceInInterval: 25 * TIMES.second,
  });

  const forgotPasswordStartRateLimiterService = new RateLimiterService({
    redis,
    prefix: 'auth-forgot-password-rate-limiter',
    maxAttempts: 5,
    window: 10 * TIMES.minute,
    onceInInterval: 25 * TIMES.second,
  });

  const forgotPasswordEndRateLimiterService = new RateLimiterService({
    redis,
    prefix: 'auth-forgot-password-rate-limiter',
    maxAttempts: 5,
    window: 10 * TIMES.minute,
    onceInInterval: 25 * TIMES.second,
  });

  return {
    loginRateLimiterService,
    registrationStartRateLimiterService,
    registrationEndRateLimiterService,
    forgotPasswordStartRateLimiterService,
    forgotPasswordEndRateLimiterService,
  };
};
