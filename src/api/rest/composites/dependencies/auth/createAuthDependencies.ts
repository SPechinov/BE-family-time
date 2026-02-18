import { RedisClient, TIMES } from '@/pkg';
import { Pool } from 'pg';
import { AuthUseCases } from '@/useCases';
import { RefreshTokensStore } from '@/repositories/stores';
import { IAuthMiddleware } from '@/api/rest/domains';
import { createUsersService } from '../common/createUsersService';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { AuthMiddleware } from '@/api/rest/middlewares';
import { JwtService } from '@/services/jwt';
import { OtpCodesService } from '@/services';
import { CONFIG } from '@/config';

export interface AuthDependencies {
  authMiddleware: IAuthMiddleware;
  authUseCases: AuthUseCases;
}

interface CreateAuthDependenciesProps {
  redis: RedisClient;
  postgres: Pool;
}

export const createAuthDependencies = ({ redis, postgres }: CreateAuthDependenciesProps): AuthDependencies => {
  const jwtService = new JwtService();

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

  const rateLimiter = new RateLimiterRedis({
    storeClient: redis,
    points: 50,
    duration: TIMES.hour / 1000,
    blockDuration: TIMES.hour / 1000,
  });

  const authUseCases = new AuthUseCases({
    usersService: createUsersService(postgres),
    registrationOtpCodesService,
    forgotPasswordOtpCodesService,
    rateLimiter,
    refreshTokensStore: new RefreshTokensStore({ redis }),
    jwtService,
  });

  return {
    authMiddleware: new AuthMiddleware({ jwtService }),
    authUseCases,
  };
};
