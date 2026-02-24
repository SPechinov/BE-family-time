import { createResponseSchema } from '@/api/rest/utils';
import { GLOBAL_SCHEMAS, GROUP_SCHEMA } from '@/api/rest/schemas';
import { z } from 'zod';

const GET_LIST = {
  tags: ['Groups'],
  response: createResponseSchema({
    200: z.array(GROUP_SCHEMA),
  }),
};

const CREATE = {
  tags: ['Groups'],
  body: z.object({
    name: GLOBAL_SCHEMAS.groupName,
    description: GLOBAL_SCHEMAS.groupDescription.optional(),
  }),
};

const GET = {
  tags: ['Groups'],
  params: z.object({
    groupId: z.uuidv4(),
  }),
  response: createResponseSchema({
    200: GROUP_SCHEMA,
  }),
};

export const SCHEMAS = Object.freeze({
  getList: GET_LIST,
  create: CREATE,
  get: GET,
});
