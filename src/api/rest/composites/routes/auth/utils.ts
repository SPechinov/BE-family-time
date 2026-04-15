import { Pool } from 'pg';
import { RedisClient, TIMES } from '@/pkg';
import {
  AuthUseCases,
  GetSessionsUseCase,
  LogoutAllSessionsUseCase,
  LogoutSessionByIdUseCase,
  LogoutSessionUseCase,
  RefreshTokensUseCase,
} from '@/useCases';
import { OtpCodesStore, TokensSessionsBlacklistStore, TokensSessions } from '@/repositories/stores';
import { RateLimiterService } from '@/services';
import { CONFIG } from '@/config';

import { createUsersService } from '../../utils';

interface Props {
  redis: RedisClient;
  postgres: Pool;
}

export const createDependencies = ({ redis, postgres }: Props) => {
  const registrationOtpCodesStore = new OtpCodesStore({
    redis,
    prefix: 'auth-registration-otp',
    codeLength: CONFIG.codesLength.registration,
    ttlSec: CONFIG.ttls.registrationSec,
  });

  const forgotPasswordOtpCodesStore = new OtpCodesStore({
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
    usersService: createUsersService({ postgres }),
    registrationOtpCodesStore,
    forgotPasswordOtpCodesStore,
    rateLimiter,
  });
  const tokensSessionsStore = new TokensSessions({
    redis,
    sessionsIndexTtlSec: CONFIG.jwt.refresh.expiry / 1000,
  });
  const tokensSessionsBlacklistStore = new TokensSessionsBlacklistStore({
    redis,
    sessionsIndexTtlSec: CONFIG.jwt.refresh.expiry / 1000,
  });
  const refreshTokensUseCase = new RefreshTokensUseCase({
    tokensSessionsStore,
    tokensSessionsBlacklistStore,
  });
  const getSessionsUseCase = new GetSessionsUseCase({ tokensSessionsStore });
  const logoutSessionUseCase = new LogoutSessionUseCase({
    tokensSessionsStore,
    tokensSessionsBlacklistStore,
  });
  const logoutAllSessionsUseCase = new LogoutAllSessionsUseCase({
    tokensSessionsStore,
    tokensSessionsBlacklistStore,
  });
  const logoutSessionByIdUseCase = new LogoutSessionByIdUseCase({
    tokensSessionsStore,
    tokensSessionsBlacklistStore,
  });

  return {
    authUseCases,
    refreshTokensUseCase,
    getSessionsUseCase,
    logoutSessionUseCase,
    logoutAllSessionsUseCase,
    logoutSessionByIdUseCase,
    tokensSessionsStore,
    tokensSessionsBlacklistStore,
  };
};
