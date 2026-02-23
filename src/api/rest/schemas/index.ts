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
  userAgent: z.string().min(1),
  groupName: z.string().max(50),
  groupDescription: z.string().max(1000),
};

export const SESSION_SCHEMA = z
  .object({
    expiresAt: z.number(),
    userAgent: z.string().nullable(),
    isCurrent: z.boolean(),
  })
  .register(z.globalRegistry, { id: 'Session' });

export const USER_SCHEMA = z
  .object({
    id: z.uuidv4(),
    email: GLOBAL_SCHEMAS.email.nullable(),
    phone: z.string().nullable(),
    firstName: GLOBAL_SCHEMAS.firstName.nullable(),
    lastName: z.string().nullable(),
  })
  .register(z.globalRegistry, { id: 'User' });

export const GROUP_SCHEMA = z
  .object({ id: z.uuidv4(), name: z.string(), description: z.string().optional() })
  .register(z.globalRegistry, { id: 'Group' });
