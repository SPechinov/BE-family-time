import { z } from 'zod';
import { getDefaultSchemaResponse } from '@/api/rest/pkg';

export const SCHEMA_REGISTRATION_START = {
  body: z.object({
    email: z.email().nonempty().describe('Email address'),
  }),
  response: {
    ...getDefaultSchemaResponse(),
    200: z.undefined(),
  },
};
