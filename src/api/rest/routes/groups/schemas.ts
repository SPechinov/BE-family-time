import { createResponseSchema } from '@/api/rest/utils';
import { USER_SCHEMA } from '@/api/rest/schemas';

const GET_ME = {
  tags: ['Me'],
  response: createResponseSchema({
    200: USER_SCHEMA,
  }),
};

export const SCHEMAS = Object.freeze({
  getMe: GET_ME,
});
