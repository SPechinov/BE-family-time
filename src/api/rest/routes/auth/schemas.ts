import z from 'zod';
import { createResponseSchema } from '../../utils';
import { CONFIG } from '@/config';
import { GLOBAL_SCHEMAS } from '../../schemas';

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

export const AUTH_SCHEMAS = Object.freeze({
  registrationStart: SCHEMA_REGISTRATION_START,
  registrationEnd: SCHEMA_REGISTRATION_END,
});
