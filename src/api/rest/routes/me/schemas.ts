import { createResponseSchema } from '@/api/rest/utils';
import { z } from 'zod';

const GET_ME = {
  tags: ['Me'],
  response: createResponseSchema({
    200: z.undefined(),
  }),
};

export const SCHEMAS = Object.freeze({
  getMe: GET_ME,
});
