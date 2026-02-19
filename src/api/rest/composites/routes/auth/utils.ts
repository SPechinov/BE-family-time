import { Pool } from 'pg';
import { RedisClient, TIMES } from '@/pkg';
import { AuthUseCases } from '@/useCases';
import { RefreshTokensStore } from '@/repositories/stores';
import { OtpCodesService, RateLimiterService, JwtService } from '@/services';
import { CONFIG } from '@/config';

import { AuthMiddleware } from '../../../middlewares';
import { createUsersService } from '../../utils';

interface Props {
  redis: RedisClient;
  postgres: Pool;
}

export const createDependencies = ({ redis, postgres }: Props) => {
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

  const rateLimiter = new RateLimiterService(redis, {
    points: 50,
    duration: TIMES.hour / 1000,
    blockDuration: TIMES.hour / 1000,
    keyPrefix: 'auth',
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
