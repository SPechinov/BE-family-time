import { z } from 'zod';
import { FastifySchema } from 'fastify';
import { getDefaultResponse } from '../../pkg';

export const SCHEMA_REGISTRATION_BEGIN: FastifySchema = {
  body: z.object({
    email: z.email().nonempty().describe('Email address'),
  }),
  response: {
    ...getDefaultResponse(),
    200: z.null(),
  },
};
