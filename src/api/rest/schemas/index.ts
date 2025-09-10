import { z } from 'zod';

export const SCHEMAS_GLOBAL = {
  firstName: z.string().min(2).max(40),
  password: z.string().min(8).max(100),
};
