import { RedisClient } from '@/pkg';
import { Pool } from 'pg';
import { AuthUseCases } from '@/useCases';
import { RefreshTokensStore } from '@/repositories/stores';
import { IUsersService, IJwtService, IOtpCodesService, IRateLimiterService } from '@/domains/services';
import { IAuthMiddleware } from '@/api/rest/domains';
import { createUsersService } from '../common/createUsersService';
import { createJwtService } from '../common/createJwtService';
import { createAuthMiddleware } from '../common/createAuthMiddleware';
import { createAuthOtpServices } from './createAuthOtpServices';
import { createAuthRateLimiters } from './createAuthRateLimiters';

export interface AuthDependencies {
  jwtService: IJwtService;
  authMiddleware: IAuthMiddleware;
  usersService: IUsersService;
  registrationOtpCodesService: IOtpCodesService;
  forgotPasswordOtpCodesService: IOtpCodesService;
  loginRateLimiterService: IRateLimiterService;
  registrationStartRateLimiterService: IRateLimiterService;
  registrationEndRateLimiterService: IRateLimiterService;
  forgotPasswordStartRateLimiterService: IRateLimiterService;
  forgotPasswordEndRateLimiterService: IRateLimiterService;
  authUseCases: AuthUseCases;
}

interface CreateAuthDependenciesProps {
  redis: RedisClient;
  postgres: Pool;
}

export const createAuthDependencies = (props: CreateAuthDependenciesProps): AuthDependencies => {
  const { redis, postgres } = props;

  const jwtService = createJwtService();
  const usersService = createUsersService(postgres);

  const { registrationOtpCodesService, forgotPasswordOtpCodesService } = createAuthOtpServices({ redis });
  const {
    loginRateLimiterService,
    registrationStartRateLimiterService,
    registrationEndRateLimiterService,
    forgotPasswordStartRateLimiterService,
    forgotPasswordEndRateLimiterService,
  } = createAuthRateLimiters({ redis });

  const authMiddleware = createAuthMiddleware(jwtService);

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
