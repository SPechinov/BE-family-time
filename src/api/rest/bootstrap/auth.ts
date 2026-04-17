import { FastifyInstance } from 'fastify';
import { CONFIG } from '@/config';
import { AuthRoutesController } from '@/api/rest/routes/auth';
import { FastifyJwtSigner, FastifyJwtVerifier } from '@/api/rest/adapters';
import { TokensSessionsGenerator, TokensSessionsPayloadVerifier } from '@/services';
import {
  ForgotPasswordEndUseCase,
  ForgotPasswordStartUseCase,
  GetSessionsUseCase,
  LoginUseCase,
  LogoutAllSessionsUseCase,
  LogoutSessionByIdUseCase,
  LogoutSessionUseCase,
  RefreshTokensUseCase,
  RegistrationEndUseCase,
  RegistrationStartUseCase,
} from '@/useCases';
import { IUsersService } from '@/domains/services';
import { createAuthInfra } from './shared';

export const registerAuthRoutes = (props: {
  instance: FastifyInstance;
  usersService: IUsersService;
  authInfra: ReturnType<typeof createAuthInfra>;
}) => {
  const jwtVerifier = new FastifyJwtVerifier({ fastify: props.instance });
  const tokensSessionsPayloadVerifier = new TokensSessionsPayloadVerifier({ jwtVerifier });
  const tokensSessionsGenerator = new TokensSessionsGenerator({
    jwtSigner: new FastifyJwtSigner({ fastify: props.instance }),
    expiresInAccess: CONFIG.jwt.access.expiry / 1000,
    expiresInRefresh: CONFIG.jwt.refresh.expiry / 1000,
  });

  const loginUseCase = new LoginUseCase({
    usersService: props.usersService,
    rateLimiter: props.authInfra.rateLimiter,
    tokensSessionsGenerator,
    tokensSessionsStore: props.authInfra.tokensSessionsStore,
  });
  const registrationStartUseCase = new RegistrationStartUseCase({
    registrationOtpCodesStore: props.authInfra.registrationOtpCodesStore,
    rateLimiter: props.authInfra.rateLimiter,
  });
  const registrationEndUseCase = new RegistrationEndUseCase({
    usersService: props.usersService,
    registrationOtpCodesStore: props.authInfra.registrationOtpCodesStore,
    rateLimiter: props.authInfra.rateLimiter,
  });
  const forgotPasswordStartUseCase = new ForgotPasswordStartUseCase({
    usersService: props.usersService,
    forgotPasswordOtpCodesStore: props.authInfra.forgotPasswordOtpCodesStore,
    rateLimiter: props.authInfra.rateLimiter,
  });
  const forgotPasswordEndUseCase = new ForgotPasswordEndUseCase({
    usersService: props.usersService,
    forgotPasswordOtpCodesStore: props.authInfra.forgotPasswordOtpCodesStore,
    rateLimiter: props.authInfra.rateLimiter,
    tokensSessionsStore: props.authInfra.tokensSessionsStore,
    tokensSessionsBlacklistStore: props.authInfra.tokensSessionsBlacklistStore,
  });
  const refreshTokensUseCase = new RefreshTokensUseCase({
    tokensSessionsStore: props.authInfra.tokensSessionsStore,
    tokensSessionsBlacklistStore: props.authInfra.tokensSessionsBlacklistStore,
    tokensSessionsGenerator,
    tokensSessionsPayloadVerifier,
  });
  const getSessionsUseCase = new GetSessionsUseCase({ tokensSessionsStore: props.authInfra.tokensSessionsStore });
  const logoutSessionUseCase = new LogoutSessionUseCase({
    tokensSessionsStore: props.authInfra.tokensSessionsStore,
    tokensSessionsBlacklistStore: props.authInfra.tokensSessionsBlacklistStore,
  });
  const logoutAllSessionsUseCase = new LogoutAllSessionsUseCase({
    tokensSessionsStore: props.authInfra.tokensSessionsStore,
    tokensSessionsBlacklistStore: props.authInfra.tokensSessionsBlacklistStore,
  });
  const logoutSessionByIdUseCase = new LogoutSessionByIdUseCase({
    tokensSessionsStore: props.authInfra.tokensSessionsStore,
    tokensSessionsBlacklistStore: props.authInfra.tokensSessionsBlacklistStore,
  });

  new AuthRoutesController({
    fastify: props.instance,
    loginUseCase,
    registrationStartUseCase,
    registrationEndUseCase,
    forgotPasswordStartUseCase,
    forgotPasswordEndUseCase,
    refreshTokensUseCase,
    getSessionsUseCase,
    logoutSessionUseCase,
    logoutAllSessionsUseCase,
    logoutSessionByIdUseCase,
    tokensSessionsPayloadVerifier,
  }).register();
};
