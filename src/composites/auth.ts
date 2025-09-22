import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { RedisClient } from '@/pkg';
import { UsersRepository } from '@/repositories/db';
import { AuthUseCases } from '@/useCases/auth';
import { AuthRoutesController } from '@/api/rest';
import {
  CryptoService,
  HashPasswordService,
  HashService,
  OtpCodesService,
  RateLimiterService,
  RefreshTokenStoreService,
} from '@/services';
import { UsersService } from '@/services/users';
import { CONFIG } from '@/config';
import { JwtService } from '@/services/jwt';

export class CompositeAuth {
  constructor(props: { fastify: FastifyInstance; pool: Pool; redis: RedisClient }) {
    const usersRepository = new UsersRepository({ pool: props.pool });

    const registrationOtpStore = new OtpCodesService({
      redis: props.redis,
      prefix: 'auth-registration',
      codeLength: CONFIG.codesLength.registration,
      ttlSec: CONFIG.ttls.registrationSec,
    });

    const registrationRateLimiterService = new RateLimiterService({
      redis: props.redis,
      prefix: 'auth-registration-otp',
      maxAttempts: 3,
      windowSec: 600,
    });

    const forgotPasswordOtpStore = new OtpCodesService({
      redis: props.redis,
      prefix: 'auth-forgot-password',
      codeLength: CONFIG.codesLength.forgotPassword,
      ttlSec: CONFIG.ttls.forgotPasswordSec,
    });

    const forgotPasswordRateLimiterService = new RateLimiterService({
      redis: props.redis,
      prefix: 'auth-forgot-password',
      maxAttempts: 3,
      windowSec: 600,
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

    const jwtService = new JwtService();

    const authUseCases = new AuthUseCases({
      registrationOtpService: registrationOtpStore,
      forgotPasswordOtpService: forgotPasswordOtpStore,
      registrationRateLimiterService,
      forgotPasswordRateLimiterService,
      usersService,
      jwtService,
      refreshTokenStoreService: new RefreshTokenStoreService({ redis: props.redis }),
    });

    props.fastify.register(
      (instance) => {
        new AuthRoutesController({
          fastify: instance,
          authUseCases,
          jwtService,
        });
      },
      { prefix: '/auth' },
    );
  }
}
