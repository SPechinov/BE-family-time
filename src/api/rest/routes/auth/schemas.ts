import { z } from 'zod';

export const REGISTRATION_BEGIN_SCHEMA = z.object({
  email: z.string().max(32).describe('Some description for username'),
});
