import { RedisClient } from '@/pkg';
import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { AuthRoutesController } from '../../../routes/auth';
import { createDependencies } from './utils';
import { TokensSessionsGenerator } from '@/services';
import { CONFIG } from '@/config';
import { FastifyJwtSigner } from '../../../adapters/jwt/fastifyJwtSigner';

export class AuthComposite {
  #fastifyInstance: FastifyInstance;
  #redis: RedisClient;
  #postgres: Pool;

  constructor(props: { fastifyInstance: FastifyInstance; redis: RedisClient; postgres: Pool }) {
    this.#fastifyInstance = props.fastifyInstance;
    this.#postgres = props.postgres;
    this.#redis = props.redis;

    this.#register();
  }

  #register() {
    const dependencies = createDependencies({ redis: this.#redis, postgres: this.#postgres });
    const tokensSessionsGenerator = new TokensSessionsGenerator({
      jwtSigner: new FastifyJwtSigner({ fastify: this.#fastifyInstance }),
      expiresInAccess: CONFIG.jwt.access.expiry / 1000,
      expiresInRefresh: CONFIG.jwt.refresh.expiry / 1000,
    });

    new AuthRoutesController({
      fastify: this.#fastifyInstance,
      useCases: dependencies.authUseCases,
      tokensSessionsGenerator,
      tokensSessionsStore: dependencies.tokensSessionsStore,
      tokensSessionsBlacklistStore: dependencies.tokensSessionsBlacklistStore,
    }).register();
  }
}
