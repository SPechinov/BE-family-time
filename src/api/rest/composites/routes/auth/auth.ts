import { RedisClient } from '@/pkg';
import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { AuthRoutesController } from '../../../routes/auth';
import { createDependencies } from './utils';
import { TokenService } from '../../../services';

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

    new AuthRoutesController({
      fastify: this.#fastifyInstance,
      useCases: dependencies.authUseCases,
      tokenService: new TokenService(this.#fastifyInstance),
    }).register();
  }
}
