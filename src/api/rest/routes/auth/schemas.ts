import z from 'zod';
import { createResponseSchema } from '../../utils';
import { CONFIG } from '@/config';
import { GLOBAL_SCHEMAS, SESSION_SCHEMA } from '../../schemas';

const SCHEMA_LOGIN = {
  tags: ['Auth'],
  security: [],
  headers: z.object({
    'user-agent': GLOBAL_SCHEMAS.userAgent.describe('User-Agent браузера или клиента'),
  }),
  body: z.object({
    email: GLOBAL_SCHEMAS.email.nonempty().describe('Email адрес'),
    password: GLOBAL_SCHEMAS.password.nonempty(),
  }),
  response: createResponseSchema({
    200: z.void(),
  }),
};

const SCHEMA_REGISTRATION_START = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: GLOBAL_SCHEMAS.email.nonempty().describe('Email адрес'),
  }),
  response: createResponseSchema({
    200: z.void(),
  }),
};

const SCHEMA_REGISTRATION_END = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: GLOBAL_SCHEMAS.email.nonempty().describe('Email адрес'),
    otpCode: GLOBAL_SCHEMAS.otpCode(CONFIG.codesLength.registration),
    firstName: GLOBAL_SCHEMAS.firstName.nonempty(),
    password: GLOBAL_SCHEMAS.password.nonempty(),
    timeZone: GLOBAL_SCHEMAS.timeZone,
    language: GLOBAL_SCHEMAS.language,
  }),
  response: createResponseSchema({
    201: z.void(),
  }),
};

const SCHEMA_FORGOT_PASSWORD_START = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: GLOBAL_SCHEMAS.email.nonempty().describe('Email адрес'),
  }),
  response: createResponseSchema({
    200: z.void(),
  }),
};

const SCHEMA_FORGOT_PASSWORD_END = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: GLOBAL_SCHEMAS.email.nonempty().describe('Email адрес'),
    otpCode: GLOBAL_SCHEMAS.otpCode(CONFIG.codesLength.forgotPassword),
    password: GLOBAL_SCHEMAS.password.nonempty(),
  }),
  response: createResponseSchema({
    200: z.void(),
  }),
};

const SCHEMA_GET_ALL_SESSIONS = {
  tags: ['Auth'],
  response: createResponseSchema({
    200: z.object({
      sessions: SESSION_SCHEMA.array(),
    }),
  }),
};

const SCHEMA_LOGOUT_ALL_SESSIONS = {
  tags: ['Auth'],
  response: createResponseSchema({
    200: z.void(),
  }),
};

const SCHEMA_LOGOUT_SESSION = {
  tags: ['Auth'],
  response: createResponseSchema({
    200: z.void(),
  }),
};

const SCHEMA_REFRESH_TOKENS = {
  tags: ['Auth'],
  security: [],
  headers: z.object({
    'user-agent': GLOBAL_SCHEMAS.userAgent.describe('User-Agent браузера или клиента'),
  }),
  response: createResponseSchema({
    200: z.void(),
  }),
};

export const AUTH_SCHEMAS = Object.freeze({
  login: SCHEMA_LOGIN,
  registrationStart: SCHEMA_REGISTRATION_START,
  registrationEnd: SCHEMA_REGISTRATION_END,
  forgotPasswordStart: SCHEMA_FORGOT_PASSWORD_START,
  forgotPasswordEnd: SCHEMA_FORGOT_PASSWORD_END,
  getAllSession: SCHEMA_GET_ALL_SESSIONS,
  logoutAllSession: SCHEMA_LOGOUT_ALL_SESSIONS,
  logoutSession: SCHEMA_LOGOUT_SESSION,
  refreshTokens: SCHEMA_REFRESH_TOKENS,
});
