import { z } from 'zod';
import { createResponseSchema } from '@/api/rest/pkg';
import { CONFIG } from '@/config';
import { SCHEMAS_GLOBAL } from '@/api/rest/schemas';

export const SHEMA_LOGIN = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: z.email().nonempty().describe('Email address'),
    password: SCHEMAS_GLOBAL.password.nonempty(),
  }),
  response: createResponseSchema({
    200: z.undefined(),
  }),
};

export const SHEMA_LOGOUT = {
  tags: ['Auth'],
  response: createResponseSchema({
    200: z.undefined(),
  }),
};

export const SCHEMA_REFRESH_TOKEN = {
  tags: ['Auth'],
  response: createResponseSchema({
    200: z.undefined(),
  }),
};

export const SCHEMA_REGISTRATION_START = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: z.email().nonempty().describe('Email address'),
  }),
  response: createResponseSchema({
    200: z.undefined(),
  }),
};

export const SCHEMA_REGISTRATION_END = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: z.email().nonempty().describe('Email address'),
    code: z.string().nonempty().length(CONFIG.codesLength.registration),
    firstName: SCHEMAS_GLOBAL.firstName.nonempty(),
    password: SCHEMAS_GLOBAL.password.nonempty(),
  }),
  response: createResponseSchema({
    201: z.undefined(),
  }),
};

export const SCHEMA_FORGOT_PASSWORD_START = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: z.email().nonempty().describe('Email address'),
  }),
  response: createResponseSchema({
    200: z.undefined(),
  }),
};

export const SCHEMA_FORGOT_PASSWORD_END = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: z.email().nonempty().describe('Email address'),
    code: z.string().nonempty().length(CONFIG.codesLength.forgotPassword),
    password: SCHEMAS_GLOBAL.password.nonempty(),
  }),
  response: createResponseSchema({
    200: z.undefined(),
  }),
};
