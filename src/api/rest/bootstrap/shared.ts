import { Pool } from 'pg';
import { RedisClient, TIMES } from '@/pkg';
import { CONFIG } from '@/config';
import { OtpCodesStore, TokensSessions, TokensSessionsBlacklistStore } from '@/repositories/stores';
import { CalendarEventsRepository, GroupsRepository, GroupsUsersRepository, UsersRepository } from '@/repositories/db';
import {
  CalendarEventsService,
  EncryptionService,
  GroupsService,
  GroupsUsersService,
  HashPasswordService,
  HmacService,
  RateLimiterService,
  UsersService,
} from '@/services';

export const createCoreServices = (postgres: Pool) => {
  const usersService = new UsersService({
    usersRepository: new UsersRepository(postgres),
    hmacService: new HmacService({ salt: CONFIG.salts.hashCredentials }),
    hashPasswordService: new HashPasswordService(),
    encryptionService: new EncryptionService(),
  });

  const groupsService = new GroupsService({ groupsRepository: new GroupsRepository(postgres) });
  const groupsUsersService = new GroupsUsersService({ groupsUsersRepository: new GroupsUsersRepository(postgres) });
  const calendarEventsService = new CalendarEventsService({
    calendarEventsRepository: new CalendarEventsRepository(postgres),
  });

  return {
    usersService,
    groupsService,
    groupsUsersService,
    calendarEventsService,
  };
};

export const createAuthInfra = (redis: RedisClient) => {
  const registrationOtpCodesStore = new OtpCodesStore({
    redis,
    prefix: 'auth-registration-otp',
    codeLength: CONFIG.codesLength.registration,
    ttlSec: CONFIG.ttls.registrationSec,
  });

  const forgotPasswordOtpCodesStore = new OtpCodesStore({
    redis,
    prefix: 'auth-forgot-password-otp',
    codeLength: CONFIG.codesLength.forgotPassword,
    ttlSec: CONFIG.ttls.forgotPasswordSec,
  });

  const rateLimiter = new RateLimiterService(redis, {
    points: 50,
    duration: TIMES.hour / 1000,
    blockDuration: TIMES.hour / 1000,
    keyPrefix: 'auth',
  });

  const tokensSessionsStore = new TokensSessions({
    redis,
    sessionsIndexTtlSec: CONFIG.jwt.refresh.expiry / 1000,
  });

  const tokensSessionsBlacklistStore = new TokensSessionsBlacklistStore({
    redis,
    sessionsIndexTtlSec: CONFIG.jwt.refresh.expiry / 1000,
  });

  return {
    registrationOtpCodesStore,
    forgotPasswordOtpCodesStore,
    rateLimiter,
    tokensSessionsStore,
    tokensSessionsBlacklistStore,
  };
};
