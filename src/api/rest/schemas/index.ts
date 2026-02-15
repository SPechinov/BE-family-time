import z from 'zod';

export const GLOBAL_SCHEMAS = {
  firstName: z.string().min(2).max(40),
  password: z.string().min(8).max(100),
  email: z.email().max(254),
  otpCode: (length: number) =>
    z
      .string()
      .length(length)
      .refine((v) => !isNaN(Number(v)), { message: 'Invalid number' }),
};

export const SESSION_SCHEMA = z.object({
  expiresAt: z.number(),
  userAgent: z.string().nullable(),
  isCurrent: z.boolean().optional(),
});
