import { newFastify, RedisClient } from '@/pkg';
import { CONFIG } from '@/config';
import { Pool } from 'pg';
import { globalErrorHandler } from './utils';
import { AuthRoutesController } from './routes/auth';
import { AuthUseCases } from '@/useCases/auth';
import { UsersRepository } from '@/repositories/db';
import {
  CryptoService,
  HashPasswordService,
  HashService,
  OtpCodesService,
  RateLimiterService,
  UsersService,
} from '@/services';

interface Props {
  redis: RedisClient;
  postgres: Pool;
}

export const newApiRest = async (props: Props) => {
  const fastify = newFastify({
    errorHandler: globalErrorHandler,
  });

  const registrationOtpCodesService = new OtpCodesService({
    redis: props.redis,
    prefix: 'auth-registration-otp',
    codeLength: CONFIG.codesLength.registration,
    ttlSec: CONFIG.ttls.registrationSec,
  });

  const registrationStartRateLimiterService = new RateLimiterService({
    redis: props.redis,
    prefix: 'auth-registration-start-rate-limiter',
    maxAttempts: 3,
    windowSec: 600,
  });

  const registrationEndRateLimiterService = new RateLimiterService({
    redis: props.redis,
    prefix: 'auth-registration-end-rate-limiter',
    maxAttempts: 3,
    windowSec: 600,
  });

  const forgotPasswordOtpCodesService = new OtpCodesService({
    redis: props.redis,
    prefix: 'auth-forgot-password-otp',
    codeLength: CONFIG.codesLength.forgotPassword,
    ttlSec: CONFIG.ttls.forgotPasswordSec,
  });

  const forgotPasswordStartRateLimiterService = new RateLimiterService({
    redis: props.redis,
    prefix: 'auth-forgot-password-rate-limiter',
    maxAttempts: 3,
    windowSec: 600,
  });

  const forgotPasswordEndRateLimiterService = new RateLimiterService({
    redis: props.redis,
    prefix: 'auth-forgot-password-rate-limiter',
    maxAttempts: 3,
    windowSec: 600,
  });

  const userHashService = new HashService({
    salt: CONFIG.salts.hashCredentials,
  });

  const hashPasswordService = new HashPasswordService();
  const cryptoService = new CryptoService();

  const usersRepository = new UsersRepository({ pool: props.postgres });
  const userService = new UsersService({
    usersRepository,
    hashService: userHashService,
    hashPasswordService,
    cryptoService,
  });
  const authUseCases = new AuthUseCases({
    userService,
    registrationOtpCodesService,
    forgotPasswordOtpCodesService,
    registrationStartRateLimiterService,
    registrationEndRateLimiterService,
    forgotPasswordStartRateLimiterService,
    forgotPasswordEndRateLimiterService,
  });

  fastify.register(
    (instance) => {
      new AuthRoutesController({ fastify: instance, useCases: authUseCases }).register();
    },
    { prefix: '/api' },
  );

  fastify.listen({ port: CONFIG.server.port }, (error, address) => {
    if (error) throw error;
    console.log(`Сервер запущен по адресу: ${address}`);
  });

  await fastify.ready();
  fastify.swagger();

  return fastify;
};
