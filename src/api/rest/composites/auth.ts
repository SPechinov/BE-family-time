import { RedisClient } from '@/pkg';
import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { AuthRoutesController } from '../routes/auth';
import {
  CryptoService,
  HashPasswordService,
  HashService,
  OtpCodesService,
  RateLimiterService,
  UsersService,
} from '@/services';
import { CONFIG } from '@/config';
import { UsersRepository } from '@/repositories/db';
import { AuthUseCases } from '@/useCases';

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
    const registrationOtpCodesService = new OtpCodesService({
      redis: this.#redis,
      prefix: 'auth-registration-otp',
      codeLength: CONFIG.codesLength.registration,
      ttlSec: CONFIG.ttls.registrationSec,
    });

    const registrationStartRateLimiterService = new RateLimiterService({
      redis: this.#redis,
      prefix: 'auth-registration-start-rate-limiter',
      maxAttempts: 3,
      windowSec: 600,
    });

    const registrationEndRateLimiterService = new RateLimiterService({
      redis: this.#redis,
      prefix: 'auth-registration-end-rate-limiter',
      maxAttempts: 3,
      windowSec: 600,
    });

    const forgotPasswordOtpCodesService = new OtpCodesService({
      redis: this.#redis,
      prefix: 'auth-forgot-password-otp',
      codeLength: CONFIG.codesLength.forgotPassword,
      ttlSec: CONFIG.ttls.forgotPasswordSec,
    });

    const forgotPasswordStartRateLimiterService = new RateLimiterService({
      redis: this.#redis,
      prefix: 'auth-forgot-password-rate-limiter',
      maxAttempts: 3,
      windowSec: 600,
    });

    const forgotPasswordEndRateLimiterService = new RateLimiterService({
      redis: this.#redis,
      prefix: 'auth-forgot-password-rate-limiter',
      maxAttempts: 3,
      windowSec: 600,
    });

    const userHashService = new HashService({
      salt: CONFIG.salts.hashCredentials,
    });

    const hashPasswordService = new HashPasswordService();
    const cryptoService = new CryptoService();

    const usersRepository = new UsersRepository({ pool: this.#postgres });
    const userService = new UsersService({
      usersRepository,
      hashService: userHashService,
      hashPasswordService,
      cryptoService,
    });
    const authUseCases = new AuthUseCases({
      usersService: userService,
      registrationOtpCodesService,
      forgotPasswordOtpCodesService,
      registrationStartRateLimiterService,
      registrationEndRateLimiterService,
      forgotPasswordStartRateLimiterService,
      forgotPasswordEndRateLimiterService,
    });

    new AuthRoutesController({ fastify: this.#fastifyInstance, useCases: authUseCases }).register();
  }
}
