import z from 'zod';
import { createResponseSchema } from '../../utils';
import { CONFIG } from '@/config';
import { GLOBAL_SCHEMAS, SESSION_SCHEMA } from '../../schemas';

const LOGIN = {
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

const REGISTRATION_START = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: GLOBAL_SCHEMAS.email.nonempty().describe('Email адрес'),
  }),
  response: createResponseSchema({
    200: z.void(),
  }),
};

const REGISTRATION_END = {
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

const FORGOT_PASSWORD_START = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: GLOBAL_SCHEMAS.email.nonempty().describe('Email адрес'),
  }),
  response: createResponseSchema({
    200: z.void(),
  }),
};

const FORGOT_PASSWORD_END = {
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

const GET_ALL_SESSIONS = {
  tags: ['Auth'],
  response: createResponseSchema({
    200: z.object({
      sessions: SESSION_SCHEMA.array(),
    }),
  }),
};

const LOGOUT_ALL_SESSIONS = {
  tags: ['Auth'],
  response: createResponseSchema({
    200: z.void(),
  }),
};

const LOGOUT_SESSION = {
  tags: ['Auth'],
  response: createResponseSchema({
    200: z.void(),
  }),
};

const LOGOUT_SESSION_BY_ID = {
  tags: ['Auth'],
  params: z.object({
    sessionId: z.uuidv4(),
  }),
  response: createResponseSchema({
    200: z.void(),
  }),
};

const REFRESH_TOKENS = {
  tags: ['Auth'],
  security: [],
  headers: z.object({
    'user-agent': GLOBAL_SCHEMAS.userAgent.describe('User-Agent браузера или клиента'),
  }),
  response: createResponseSchema({
    200: z.void(),
  }),
};

export const SCHEMAS = Object.freeze({
  login: LOGIN,
  registrationStart: REGISTRATION_START,
  registrationEnd: REGISTRATION_END,
  forgotPasswordStart: FORGOT_PASSWORD_START,
  forgotPasswordEnd: FORGOT_PASSWORD_END,
  getAllSessions: GET_ALL_SESSIONS,
  logoutAllSessions: LOGOUT_ALL_SESSIONS,
  logoutSession: LOGOUT_SESSION,
  logoutSessionById: LOGOUT_SESSION_BY_ID,
  refreshTokens: REFRESH_TOKENS,
});
