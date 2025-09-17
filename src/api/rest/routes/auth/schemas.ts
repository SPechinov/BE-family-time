import { z } from 'zod';
import { getDefaultSchemaResponse } from '@/api/rest/pkg';
import { CONFIG } from '@/config';
import { SCHEMAS_GLOBAL } from '@/api/rest/schemas';

export const SCHEMA_REGISTRATION_START = {
  body: z.object({
    email: z.email().nonempty().describe('Email address'),
  }),
  response: {
    ...getDefaultSchemaResponse(),
    200: z.undefined(),
  },
};

export const SCHEMA_REGISTRATION_END = {
  body: z.object({
    email: z.email().nonempty().describe('Email address'),
    code: z.string().nonempty().length(CONFIG.codesLength.registration),
    firstName: SCHEMAS_GLOBAL.firstName.nonempty(),
    password: SCHEMAS_GLOBAL.password.nonempty(),
  }),
  response: {
    ...getDefaultSchemaResponse(),
    201: z.undefined(),
  },
};

export const SCHEMA_FORGOT_PASSWORD_START = {
  body: z.object({
    email: z.email().nonempty().describe('Email address'),
  }),
  response: {
    ...getDefaultSchemaResponse(),
    200: z.undefined(),
  },
};

export const SCHEMA_FORGOT_PASSWORD_END = {
  body: z.object({
    email: z.email().nonempty().describe('Email address'),
    code: z.string().nonempty().length(CONFIG.codesLength.forgotPassword),
    password: SCHEMAS_GLOBAL.password.nonempty(),
  }),
  response: {
    ...getDefaultSchemaResponse(),
    200: z.undefined(),
  },
};
