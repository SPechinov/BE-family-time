import z from 'zod';
import { CalendarEventId, GroupId, UserId } from '@/entities';

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
  groupName: z.string().min(1).max(50),
  groupDescription: z.string().max(1000),
  groupId: z.uuidv4().brand<GroupId>(),
  userId: z.uuidv4().brand<UserId>(),
  calendarEventId: z.uuidv4().brand<CalendarEventId>(),
  calendarEventTitle: z.string().min(1).max(50),
  calendarEventDescription: z.string().min(1).max(1000),
  calendarEventType: z.enum(['birthday', 'vacation', 'holiday']),
  calendarEventIterationType: z.enum(['oneTime', 'weekly', 'monthly', 'yearly']),
  calendarEventRecurrencePattern: z.union([
    z.object({
      type: z.literal('weekly'),
      dayOfWeek: z.number().min(0).max(6),
    }),
    z.object({
      type: z.literal('monthly'),
      dayOfMonth: z.number().min(0).max(30),
    }),
  ]),
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
    id: GLOBAL_SCHEMAS.userId,
    email: GLOBAL_SCHEMAS.email.nullable(),
    phone: z.string().nullable(),
    firstName: GLOBAL_SCHEMAS.firstName.nullable(),
    lastName: z.string().nullable(),
  })
  .register(z.globalRegistry, { id: 'User' });

export const GROUP_SCHEMA = z
  .object({ id: GLOBAL_SCHEMAS.groupId, name: z.string(), description: z.string().optional() })
  .register(z.globalRegistry, { id: 'Group' });

export const CALENDAR_EVENT_SCHEMA = z
  .object({
    id: GLOBAL_SCHEMAS.calendarEventId,
    title: GLOBAL_SCHEMAS.calendarEventTitle,
    description: GLOBAL_SCHEMAS.calendarEventDescription.optional(),
    type: GLOBAL_SCHEMAS.calendarEventType,
    iterationType: GLOBAL_SCHEMAS.calendarEventIterationType,
    startDate: z.date(),
    endDate: z.date().optional(),
    recurrencePattern: GLOBAL_SCHEMAS.calendarEventRecurrencePattern.optional(),
  })
  .register(z.globalRegistry, { id: 'CalendarEvent' });
