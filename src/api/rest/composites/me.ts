import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { MeRoutesController } from '@/api/rest/routes/me';
import { JwtService } from '@/services/jwt';
import { AuthMiddleware } from '@/api/rest/middlewares';
import { MeUseCase } from '@/useCases';
import { UsersRepository } from '@/repositories/db';
import { EncryptionService, HashPasswordService, HmacService, UsersService } from '@/services';
import { CONFIG } from '@/config';

export class MeComposite {
  #fastifyInstance: FastifyInstance;
  #postgres: Pool;

  constructor(props: { fastifyInstance: FastifyInstance; postgres: Pool }) {
    this.#fastifyInstance = props.fastifyInstance;
    this.#postgres = props.postgres;

    this.#register();
  }

  #register() {
    const jwtService = new JwtService();

    const authMiddleware = new AuthMiddleware({ jwtService });

    const usersRepository = new UsersRepository({ pool: this.#postgres });
    const usersService = new UsersService({
      usersRepository,
      hmacService: new HmacService({ salt: CONFIG.salts.hashCredentials }),
      hashPasswordService: new HashPasswordService(),
      encryptionService: new EncryptionService(),
    });

    const meUseCases = new MeUseCase({
      usersService,
    });

    new MeRoutesController({
      fastify: this.#fastifyInstance,
      authMiddleware,
      meUseCases,
    }).register();
  }
}
