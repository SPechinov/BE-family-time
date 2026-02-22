import { createResponseSchema } from '@/api/rest/utils';
import { GROUP_SCHEMA } from '@/api/rest/schemas';
import { z } from 'zod';

const GET_LIST = {
  tags: ['Groups'],
  response: createResponseSchema({
    200: z.array(GROUP_SCHEMA),
  }),
};

export const SCHEMAS = Object.freeze({
  getList: GET_LIST,
});
