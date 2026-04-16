import { FastifyInstance, FastifyRequest } from 'fastify';
import { Pool } from 'pg';
import { CONFIG } from '@/config';
import { RedisClient, TIMES } from '@/pkg';
import { DbTransactionService } from '@/pkg/dbTransaction';
import { authenticate } from '@/api/rest/utils';
import { AuthRoutesController } from '@/api/rest/routes/auth';
import { CalendarEventsRoutesController } from '@/api/rest/routes/calendarEvents';
import { GroupsRoutesController } from '@/api/rest/routes/groups';
import { MeRoutesController } from '@/api/rest/routes/me';
import { TokensSessionsBlacklistStore, OtpCodesStore, TokensSessions } from '@/repositories/stores';
import { CalendarEventsRepository, GroupsRepository, GroupsUsersRepository, UsersRepository } from '@/repositories/db';
import {
  CalendarEventsService,
  EncryptionService,
  GroupsService,
  GroupsUsersService,
  HashPasswordService,
  HmacService,
  RateLimiterService,
  TokensSessionsGenerator,
  TokensSessionsPayloadVerifier,
  UsersService,
} from '@/services';
import { FastifyJwtSigner, FastifyJwtVerifier } from '@/api/rest/adapters';
import {
  CalendarEventsUseCases,
  ForgotPasswordEndUseCase,
  ForgotPasswordStartUseCase,
  GetSessionsUseCase,
  GroupsUseCases,
  LoginUseCase,
  LogoutAllSessionsUseCase,
  LogoutSessionByIdUseCase,
  LogoutSessionUseCase,
  MeUseCases,
  RefreshTokensUseCase,
  RegistrationEndUseCase,
  RegistrationStartUseCase,
} from '@/useCases';

export const registerRestApi = (props: { fastify: FastifyInstance; redis: RedisClient; postgres: Pool }): void => {
  const usersService = new UsersService({
    usersRepository: new UsersRepository(props.postgres),
    hmacService: new HmacService({ salt: CONFIG.salts.hashCredentials }),
    hashPasswordService: new HashPasswordService(),
    encryptionService: new EncryptionService(),
  });
  const groupsService = new GroupsService({ groupsRepository: new GroupsRepository(props.postgres) });
  const groupsUsersService = new GroupsUsersService({
    groupsUsersRepository: new GroupsUsersRepository(props.postgres),
  });
  const calendarEventsService = new CalendarEventsService({
    calendarEventsRepository: new CalendarEventsRepository(props.postgres),
  });

  const registrationOtpCodesStore = new OtpCodesStore({
    redis: props.redis,
    prefix: 'auth-registration-otp',
    codeLength: CONFIG.codesLength.registration,
    ttlSec: CONFIG.ttls.registrationSec,
  });
  const forgotPasswordOtpCodesStore = new OtpCodesStore({
    redis: props.redis,
    prefix: 'auth-forgot-password-otp',
    codeLength: CONFIG.codesLength.forgotPassword,
    ttlSec: CONFIG.ttls.forgotPasswordSec,
  });
  const rateLimiter = new RateLimiterService(props.redis, {
    points: 50,
    duration: TIMES.hour / 1000,
    blockDuration: TIMES.hour / 1000,
    keyPrefix: 'auth',
  });
  const tokensSessionsStore = new TokensSessions({
    redis: props.redis,
    sessionsIndexTtlSec: CONFIG.jwt.refresh.expiry / 1000,
  });
  const tokensSessionsBlacklistStore = new TokensSessionsBlacklistStore({
    redis: props.redis,
    sessionsIndexTtlSec: CONFIG.jwt.refresh.expiry / 1000,
  });

  props.fastify.decorate('authenticate', (request: FastifyRequest) => {
    return authenticate(request, { tokensSessionsBlacklistStore });
  });

  props.fastify.register(
    (instance) => {
      const jwtVerifier = new FastifyJwtVerifier({ fastify: instance });
      const tokensSessionsPayloadVerifier = new TokensSessionsPayloadVerifier({ jwtVerifier });
      const tokensSessionsGenerator = new TokensSessionsGenerator({
        jwtSigner: new FastifyJwtSigner({ fastify: instance }),
        expiresInAccess: CONFIG.jwt.access.expiry / 1000,
        expiresInRefresh: CONFIG.jwt.refresh.expiry / 1000,
      });

      const loginUseCase = new LoginUseCase({
        usersService,
        rateLimiter,
        tokensSessionsGenerator,
        tokensSessionsStore,
        tokensSessionsPayloadVerifier,
      });
      const registrationStartUseCase = new RegistrationStartUseCase({
        registrationOtpCodesStore,
        rateLimiter,
      });
      const registrationEndUseCase = new RegistrationEndUseCase({
        usersService,
        registrationOtpCodesStore,
        rateLimiter,
      });
      const forgotPasswordStartUseCase = new ForgotPasswordStartUseCase({
        usersService,
        forgotPasswordOtpCodesStore,
        rateLimiter,
      });
      const forgotPasswordEndUseCase = new ForgotPasswordEndUseCase({
        usersService,
        forgotPasswordOtpCodesStore,
        rateLimiter,
        tokensSessionsStore,
        tokensSessionsBlacklistStore,
      });
      const refreshTokensUseCase = new RefreshTokensUseCase({
        tokensSessionsStore,
        tokensSessionsBlacklistStore,
        tokensSessionsGenerator,
        tokensSessionsPayloadVerifier,
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

      const meUseCases = new MeUseCases({ usersService });
      const groupsUseCases = new GroupsUseCases({
        groupsService,
        usersService,
        groupsUsersService,
        transactionService: new DbTransactionService(props.postgres),
      });
      const calendarEventsUseCases = new CalendarEventsUseCases({
        usersService,
        groupsUsersService,
        calendarEventsService,
      });

      new AuthRoutesController({
        fastify: instance,
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

      new MeRoutesController({
        fastify: instance,
        meUseCases,
      }).register();

      new GroupsRoutesController({
        fastify: instance,
        groupsUseCases,
      }).register();

      new CalendarEventsRoutesController({
        fastify: instance,
        calendarEventsUseCases,
      }).register();
    },
    { prefix: '/api' },
  );
};
