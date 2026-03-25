import { createResponseSchema } from '@/api/rest/utils';
import { GLOBAL_SCHEMAS, USER_SCHEMA } from '@/api/rest/schemas';
import { z } from 'zod';

const GET_ME = {
  tags: ['Me'],
  response: createResponseSchema({
    200: USER_SCHEMA,
  }),
};

const PATCH = {
  tags: ['Me'],
  body: z.object({
    firstName: GLOBAL_SCHEMAS.firstName.nullable().optional(),
    lastName: GLOBAL_SCHEMAS.lastName.nullable().optional().or(GLOBAL_SCHEMAS.emptyString),
    dateOfBirth: z.coerce.date().nullable().optional(),
  }),
  response: createResponseSchema({
    200: USER_SCHEMA,
  }),
};

export const SCHEMAS = Object.freeze({
  getMe: GET_ME,
  patch: PATCH,
});
