import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { RedisClient } from '@/pkg';
import { UsersRepository } from '@/repositories/db';
import { AuthUseCases } from '@/useCases/auth';
import { AuthRoutesController } from '@/api/rest';
import { CryptoService, HashPasswordService, HashService } from '@/services';
import { UsersService } from '@/services/users';
import { CONFIG } from '@/config';
import { OtpCodesStore } from '@/repositories/stores';

export class CompositeAuth {
  constructor(props: { fastify: FastifyInstance; pool: Pool; redis: RedisClient }) {
    const usersRepository = new UsersRepository({ pool: props.pool });

    const authRegistrationOtpStore = new OtpCodesStore({
      redis: props.redis,
      keyPrefix: 'auth:registration-otp',
      codeLength: CONFIG.codesLength.registration,
      ttlSec: CONFIG.ttls.registrationSec,
    });

    const authForgotPasswordOtpStore = new OtpCodesStore({
      redis: props.redis,
      keyPrefix: 'auth:forgot-password-otp',
      codeLength: CONFIG.codesLength.forgotPassword,
      ttlSec: CONFIG.ttls.forgotPasswordSec,
    });

    const hashPasswordService = new HashPasswordService();
    const hashService = new HashService();
    const cryptoService = new CryptoService();

    const usersService = new UsersService({
      hashService,
      cryptoService,
      hashPasswordService,
      usersRepository,
    });

    const authUseCases = new AuthUseCases({
      authRegistrationOtpStore,
      authForgotPasswordOtpStore,
      usersService,
    });

    props.fastify.register(
      (instance) => {
        new AuthRoutesController({
          fastify: instance,
          authUseCases,
        });
      },
      { prefix: '/auth' },
    );
  }
}
