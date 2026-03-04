import { RedisClient } from '@/pkg';
import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { AuthRoutesController } from '../../../routes/auth';
import { createDependencies } from './utils';
import { ITokensService } from '../../../domains';

export class AuthComposite {
  #fastifyInstance: FastifyInstance;
  #redis: RedisClient;
  #postgres: Pool;
  #tokensService: ITokensService;

  constructor(props: {
    fastifyInstance: FastifyInstance;
    redis: RedisClient;
    postgres: Pool;
    tokensService: ITokensService;
  }) {
    this.#fastifyInstance = props.fastifyInstance;
    this.#postgres = props.postgres;
    this.#redis = props.redis;
    this.#tokensService = props.tokensService;

    this.#register();
  }

  #register() {
    const dependencies = createDependencies({ redis: this.#redis, postgres: this.#postgres });

    new AuthRoutesController({
      fastify: this.#fastifyInstance,
      useCases: dependencies.authUseCases,
      tokenService: this.#tokensService,
    }).register();
  }
}
