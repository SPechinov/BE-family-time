import { newFastify, RedisClient } from '@/pkg';
import { CONFIG } from '@/config';
import { Pool } from 'pg';
import { globalErrorHandler } from './utils';
import { AuthRoutesController } from './routes/auth';
import { AuthUseCases } from '@/useCases/auth';
import { UsersService } from '@/services/users';
import { UsersRepository } from '@/repositories/db';
import { OtpCodesService } from '@/services';
import { RateLimiterService } from '@/services/rateLimiter';
import { HashService } from '@/services/hash';

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

  const userHashService = new HashService({
    salt: CONFIG.salts.hashCredentials,
  });

  const usersRepository = new UsersRepository({ pool: props.postgres });
  const userService = new UsersService({ usersRepository, hashService: userHashService });
  const authUseCases = new AuthUseCases({
    userService,
    registrationOtpCodesService,
    registrationRateLimiterService,
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
