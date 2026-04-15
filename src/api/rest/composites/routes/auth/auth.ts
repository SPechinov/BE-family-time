import { RedisClient } from '@/pkg';
import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { AuthRoutesController } from '../../../routes/auth';
import { createDependencies } from './utils';
import { TokensSessionsGenerator } from '@/services';
import { CONFIG } from '@/config';
import { FastifyJwtSigner, FastifyJwtVerifier } from '../../../adapters';
import { ForgotPasswordEndUseCase, LoginUseCase } from '@/useCases';

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
    const tokensSessionsGenerator = new TokensSessionsGenerator({
      jwtSigner: new FastifyJwtSigner({ fastify: this.#fastifyInstance }),
      expiresInAccess: CONFIG.jwt.access.expiry / 1000,
      expiresInRefresh: CONFIG.jwt.refresh.expiry / 1000,
    });
    const loginUseCase = new LoginUseCase({
      authUseCases: dependencies.authUseCases,
      tokensSessionsGenerator,
      tokensSessionsStore: dependencies.tokensSessionsStore,
      jwtVerifier,
    });
    const forgotPasswordEndUseCase = new ForgotPasswordEndUseCase({
      authUseCases: dependencies.authUseCases,
      tokensSessionsStore: dependencies.tokensSessionsStore,
      tokensSessionsBlacklistStore: dependencies.tokensSessionsBlacklistStore,
    });

    new AuthRoutesController({
      fastify: this.#fastifyInstance,
      useCases: dependencies.authUseCases,
      loginUseCase,
      forgotPasswordEndUseCase,
      refreshTokensUseCase: dependencies.refreshTokensUseCase,
      getSessionsUseCase: dependencies.getSessionsUseCase,
      logoutSessionUseCase: dependencies.logoutSessionUseCase,
      logoutAllSessionsUseCase: dependencies.logoutAllSessionsUseCase,
      logoutSessionByIdUseCase: dependencies.logoutSessionByIdUseCase,
      tokensSessionsGenerator,
      tokensSessionsStore: dependencies.tokensSessionsStore,
      tokensSessionsBlacklistStore: dependencies.tokensSessionsBlacklistStore,
    }).register();
  }
}
