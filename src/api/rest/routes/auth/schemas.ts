import { z } from 'zod';
import { FastifySchema } from 'fastify';
import { getDefaultSchemaResponse } from '../../pkg';

export const SCHEMA_REGISTRATION_BEGIN: FastifySchema = {
  body: z.object({
    email: z.email().nonempty().describe('Email address'),
  }),
  response: {
    ...getDefaultSchemaResponse(),
    200: z.null(),
  },
};
