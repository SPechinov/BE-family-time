import { createResponseSchema } from '@/api/rest/utils';
import { z } from 'zod';

const GET_ME = {
  tags: ['Me'],
  response: createResponseSchema({
    200: z.object({
      id: z.string(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      firstName: z.string().nullable(),
      lastName: z.string().nullable(),
    }),
  }),
};

export const SCHEMAS = Object.freeze({
  getMe: GET_ME,
});
