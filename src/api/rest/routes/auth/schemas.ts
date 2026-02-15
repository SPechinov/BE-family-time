import z from 'zod';
import { createResponseSchema } from '../../utils';
import { CONFIG } from '@/config';
import { GLOBAL_SCHEMAS, SESSION_SCHEMA } from '../../schemas';

const SCHEMA_LOGIN = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: GLOBAL_SCHEMAS.email.nonempty().describe('Email адрес'),
    password: GLOBAL_SCHEMAS.password.nonempty(),
  }),
  response: createResponseSchema({
    200: z.undefined(),
  }),
};

const SCHEMA_REGISTRATION_START = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: GLOBAL_SCHEMAS.email.nonempty().describe('Email адрес'),
  }),
  response: createResponseSchema({
    200: z.undefined(),
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
  }),
  response: createResponseSchema({
    201: z.undefined(),
  }),
};

const SCHEMA_FORGOT_PASSWORD_START = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: GLOBAL_SCHEMAS.email.nonempty().describe('Email адрес'),
  }),
  response: createResponseSchema({
    200: z.undefined(),
  }),
};

const SCHEMA_FORGOT_PASSWORD_END = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: GLOBAL_SCHEMAS.email.nonempty().describe('Email адрес'),
    otpCode: GLOBAL_SCHEMAS.otpCode(CONFIG.codesLength.registration),
    password: GLOBAL_SCHEMAS.password.nonempty(),
  }),
  response: createResponseSchema({
    200: z.undefined(),
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

export const AUTH_SCHEMAS = Object.freeze({
  login: SCHEMA_LOGIN,
  registrationStart: SCHEMA_REGISTRATION_START,
  registrationEnd: SCHEMA_REGISTRATION_END,
  forgotPasswordStart: SCHEMA_FORGOT_PASSWORD_START,
  forgotPasswordEnd: SCHEMA_FORGOT_PASSWORD_END,
  getAllSession: SCHEMA_GET_ALL_SESSIONS,
});
