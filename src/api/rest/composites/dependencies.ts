import { RedisClient } from '@/pkg';
import { Pool } from 'pg';
import { CONFIG } from '@/config';
import { JwtService } from '@/services/jwt';
import { AuthMiddleware } from '@/api/rest/middlewares';
import { UsersRepository } from '@/repositories/db';
import {
  EncryptionService,
  HashPasswordService,
  HmacService,
  OtpCodesService,
  RateLimiterService,
  UsersService,
} from '@/services';
import { AuthUseCases } from '@/useCases';
import { RefreshTokensStore } from '@/repositories/stores';
import { MeUseCase } from '@/useCases';
import { TIMES } from '@/pkg';

interface AuthDependencies {
  jwtService: JwtService;
  authMiddleware: AuthMiddleware;
  usersService: UsersService;
  registrationOtpCodesService: OtpCodesService;
  forgotPasswordOtpCodesService: OtpCodesService;
  loginRateLimiterService: RateLimiterService;
  registrationStartRateLimiterService: RateLimiterService;
  registrationEndRateLimiterService: RateLimiterService;
  forgotPasswordStartRateLimiterService: RateLimiterService;
  forgotPasswordEndRateLimiterService: RateLimiterService;
  authUseCases: AuthUseCases;
}

interface MeDependencies {
  jwtService: JwtService;
  authMiddleware: AuthMiddleware;
  usersService: UsersService;
  meUseCases: MeUseCase;
}

interface CreateMeDependenciesProps {
  postgres: Pool;
}

const createUsersService = (postgres: Pool): UsersService => {
  return new UsersService({
    usersRepository: new UsersRepository({ pool: postgres }),
    hmacService: new HmacService({ salt: CONFIG.salts.hashCredentials }),
    hashPasswordService: new HashPasswordService(),
    encryptionService: new EncryptionService(),
  });
};

export const createAuthDependencies = (redis: RedisClient, postgres: Pool): AuthDependencies => {
  const jwtService = new JwtService();
  const usersService = createUsersService(postgres);

  const registrationOtpCodesService = new OtpCodesService({
    redis,
    prefix: 'auth-registration-otp',
    codeLength: CONFIG.codesLength.registration,
    ttlSec: CONFIG.ttls.registrationSec,
  });

  const forgotPasswordOtpCodesService = new OtpCodesService({
    redis,
    prefix: 'auth-forgot-password-otp',
    codeLength: CONFIG.codesLength.forgotPassword,
    ttlSec: CONFIG.ttls.forgotPasswordSec,
  });

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

  const authMiddleware = new AuthMiddleware({ jwtService });

  const authUseCases = new AuthUseCases({
    usersService,
    registrationOtpCodesService,
    forgotPasswordOtpCodesService,
    loginRateLimiterService,
    registrationStartRateLimiterService,
    registrationEndRateLimiterService,
    forgotPasswordStartRateLimiterService,
    forgotPasswordEndRateLimiterService,
    refreshTokensStore: new RefreshTokensStore({ redis }),
    jwtService,
  });

  return {
    jwtService,
    authMiddleware,
    usersService,
    registrationOtpCodesService,
    forgotPasswordOtpCodesService,
    loginRateLimiterService,
    registrationStartRateLimiterService,
    registrationEndRateLimiterService,
    forgotPasswordStartRateLimiterService,
    forgotPasswordEndRateLimiterService,
    authUseCases,
  };
};

export const createMeDependencies = (props: CreateMeDependenciesProps): MeDependencies => {
  const jwtService = new JwtService();
  const usersService = createUsersService(props.postgres);
  const authMiddleware = new AuthMiddleware({ jwtService });

  const meUseCases = new MeUseCase({
    usersService,
  });

  return {
    jwtService,
    authMiddleware,
    usersService,
    meUseCases,
  };
};
