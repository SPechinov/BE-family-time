import { RedisClient } from '@/pkg';
import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { AuthRoutesController } from '../../../routes/auth';
import { createDependencies } from './utils';
import { TokensSessionsPayloadVerifier, TokensSessionsGenerator } from '@/services';
import { CONFIG } from '@/config';
import { FastifyJwtSigner, FastifyJwtVerifier } from '../../../adapters';
import {
  ForgotPasswordEndUseCase,
  ForgotPasswordStartUseCase,
  LoginUseCase,
  RefreshTokensUseCase,
  RegistrationEndUseCase,
  RegistrationStartUseCase,
} from '@/useCases';

export class AuthComposite {
  readonly #fastifyInstance: FastifyInstance;
  readonly #redis: RedisClient;
  readonly #postgres: Pool;

  constructor(props: { fastifyInstance: FastifyInstance; redis: RedisClient; postgres: Pool }) {
    this.#fastifyInstance = props.fastifyInstance;
    this.#postgres = props.postgres;
    this.#redis = props.redis;

    this.#register();
  }

  #register() {
    const dependencies = createDependencies({ redis: this.#redis, postgres: this.#postgres });
    const jwtVerifier = new FastifyJwtVerifier({ fastify: this.#fastifyInstance });
    const tokensSessionsPayloadVerifier = new TokensSessionsPayloadVerifier({ jwtVerifier });
    const tokensSessionsGenerator = new TokensSessionsGenerator({
      jwtSigner: new FastifyJwtSigner({ fastify: this.#fastifyInstance }),
      expiresInAccess: CONFIG.jwt.access.expiry / 1000,
      expiresInRefresh: CONFIG.jwt.refresh.expiry / 1000,
    });
    const loginUseCase = new LoginUseCase({
      usersService: dependencies.usersService,
      rateLimiter: dependencies.rateLimiter,
      tokensSessionsGenerator,
      tokensSessionsStore: dependencies.tokensSessionsStore,
      tokensSessionsPayloadVerifier,
    });
    const forgotPasswordEndUseCase = new ForgotPasswordEndUseCase({
      usersService: dependencies.usersService,
      forgotPasswordOtpCodesStore: dependencies.forgotPasswordOtpCodesStore,
      rateLimiter: dependencies.rateLimiter,
      tokensSessionsStore: dependencies.tokensSessionsStore,
      tokensSessionsBlacklistStore: dependencies.tokensSessionsBlacklistStore,
    });
    const registrationStartUseCase = new RegistrationStartUseCase({
      registrationOtpCodesStore: dependencies.registrationOtpCodesStore,
      rateLimiter: dependencies.rateLimiter,
    });
    const registrationEndUseCase = new RegistrationEndUseCase({
      usersService: dependencies.usersService,
      registrationOtpCodesStore: dependencies.registrationOtpCodesStore,
      rateLimiter: dependencies.rateLimiter,
    });
    const forgotPasswordStartUseCase = new ForgotPasswordStartUseCase({
      usersService: dependencies.usersService,
      forgotPasswordOtpCodesStore: dependencies.forgotPasswordOtpCodesStore,
      rateLimiter: dependencies.rateLimiter,
    });
    const refreshTokensUseCase = new RefreshTokensUseCase({
      tokensSessionsStore: dependencies.tokensSessionsStore,
      tokensSessionsBlacklistStore: dependencies.tokensSessionsBlacklistStore,
      tokensSessionsGenerator,
      tokensSessionsPayloadVerifier,
    });

    new AuthRoutesController({
      fastify: this.#fastifyInstance,
      loginUseCase,
      registrationStartUseCase,
      registrationEndUseCase,
      forgotPasswordStartUseCase,
      forgotPasswordEndUseCase,
      refreshTokensUseCase,
      getSessionsUseCase: dependencies.getSessionsUseCase,
      logoutSessionUseCase: dependencies.logoutSessionUseCase,
      logoutAllSessionsUseCase: dependencies.logoutAllSessionsUseCase,
      logoutSessionByIdUseCase: dependencies.logoutSessionByIdUseCase,
      tokensSessionsPayloadVerifier,
    }).register();
  }
}
