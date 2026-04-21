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
  response: createResponseSchema({
    201: GROUP_SCHEMA,
  }),
};

const GET = {
  tags: ['Groups'],
  params: z.object({
    groupId: GLOBAL_SCHEMAS.groupId,
  }),
  response: createResponseSchema({
    200: GROUP_SCHEMA,
  }),
};

const PATCH = {
  tags: ['Groups'],
  params: z.object({
    groupId: GLOBAL_SCHEMAS.groupId,
  }),
  body: z
    .object({
      name: GLOBAL_SCHEMAS.groupName.optional(),
      description: GLOBAL_SCHEMAS.groupDescription.nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' }),
  response: createResponseSchema({
    200: GROUP_SCHEMA,
  }),
};

const INVITE = {
  tags: ['Groups'],
  params: z.object({
    groupId: GLOBAL_SCHEMAS.groupId,
  }),
  body: z.object({
    targetUserId: GLOBAL_SCHEMAS.userId,
  }),
  response: createResponseSchema({
    200: z.void(),
  }),
};

const EXCLUDE = {
  tags: ['Groups'],
  params: z.object({
    groupId: GLOBAL_SCHEMAS.groupId,
  }),
  body: z.object({
    targetUserId: GLOBAL_SCHEMAS.userId,
  }),
  response: createResponseSchema({
    200: z.void(),
  }),
};

const DELETE = {
  tags: ['Groups'],
  params: z.object({
    groupId: GLOBAL_SCHEMAS.groupId,
  }),
  response: createResponseSchema({
    200: z.void(),
  }),
};

export const SCHEMAS = Object.freeze({
  getList: GET_LIST,
  create: CREATE,
  get: GET,
  patch: PATCH,
  invite: INVITE,
  exclude: EXCLUDE,
  delete: DELETE,
});
