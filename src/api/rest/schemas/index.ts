import z from 'zod';
import { CalendarEventId, GroupId, UserId, USER_LANGUAGES } from '@/entities';
import { isXss } from '@/api/rest/schemas/utils';

const isValidIanaTimezone = (value: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

export const GLOBAL_SCHEMAS = {
  emptyString: z.literal(''),
  firstName: z.string().min(2).max(40).refine(isXss, { message: 'Invalid characters in firstName' }),
  lastName: z.string().min(2).max(40).refine(isXss, { message: 'Invalid characters in lastName' }),
  password: z.string().min(8).max(100),
  email: z.email().max(254).refine(isXss, { message: 'Invalid characters in email' }),
  otpCode: (length: number) =>
    z
      .string()
      .length(length)
      .refine((v) => !isNaN(Number(v)), { message: 'Invalid number' }),
  userAgent: z.string().min(1),
  timeZone: z.string().min(1).refine(isValidIanaTimezone, { message: 'Invalid IANA timezone' }),
  language: z.enum(USER_LANGUAGES),
  groupName: z.string().min(1).max(50).refine(isXss, { message: 'Invalid characters in groupName' }),
  groupDescription: z.string().max(1000).refine(isXss, { message: 'Invalid characters in groupDescription' }),
  groupId: z.uuidv4().transform((val) => val as GroupId),
  userId: z.uuidv4().transform((val) => val as UserId),
  calendarEventId: z.uuidv4().transform((val) => val as CalendarEventId),
  calendarEventTitle: z.string().min(1).max(50).refine(isXss, { message: 'Invalid characters in title' }),
  calendarEventDescription: z.string().min(1).max(1000).refine(isXss, { message: 'Invalid characters in description' }),
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
    sessionId: z.uuidv4(),
    expiresAt: z.number(),
    userAgent: z.string().nullable(),
    isCurrent: z.boolean(),
  })
  .register(z.globalRegistry, { id: 'Session' });

export const USER_SCHEMA = z
  .object({
    id: GLOBAL_SCHEMAS.userId,
    timeZone: GLOBAL_SCHEMAS.timeZone,
    language: GLOBAL_SCHEMAS.language,
    email: GLOBAL_SCHEMAS.email,
    phone: z.string(),
    firstName: GLOBAL_SCHEMAS.firstName.or(GLOBAL_SCHEMAS.emptyString),
    lastName: GLOBAL_SCHEMAS.lastName.or(GLOBAL_SCHEMAS.emptyString),
    dateOfBirth: z.string(),
  })
  .register(z.globalRegistry, { id: 'User' });

export const GROUP_SCHEMA = z
  .object({ id: GLOBAL_SCHEMAS.groupId, name: z.string(), description: z.string() })
  .register(z.globalRegistry, { id: 'Group' });

export const CALENDAR_EVENT_SCHEMA = z
  .object({
    id: GLOBAL_SCHEMAS.calendarEventId,
    title: GLOBAL_SCHEMAS.calendarEventTitle,
    description: GLOBAL_SCHEMAS.calendarEventDescription.optional(),
    eventType: GLOBAL_SCHEMAS.calendarEventType.optional(),
    iterationType: GLOBAL_SCHEMAS.calendarEventIterationType,
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    recurrencePattern: GLOBAL_SCHEMAS.calendarEventRecurrencePattern.optional(),
  })
  .register(z.globalRegistry, { id: 'CalendarEvent' });
