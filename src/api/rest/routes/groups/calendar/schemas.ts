import { z } from 'zod';
import { createResponseSchema } from '@/api/rest/utils';

const CALENDAR_EVENT_SCHEMA = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  creatorUserId: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  eventType: z.enum(['one-time', 'yearly', 'weekly', 'monthly', 'work-schedule']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isAllDay: z.boolean(),
  recurrencePattern: z
    .object({
      type: z.enum(['weekly', 'monthly', 'work-schedule']),
      weekdays: z.array(z.number().min(1).max(7)).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
      shiftPattern: z.array(z.number().min(0).max(1)).optional(),
      startDate: z.string().date().optional(),
      shiftDuration: z.number().positive().optional(),
    })
    .optional(),
  parentEventId: z.string().uuid().optional().nullable(),
  isException: z.boolean(),
  exceptionDate: z.string().date().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const CREATE_EVENT_BODY_BASE = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  eventType: z.enum(['one-time', 'yearly', 'weekly', 'monthly', 'work-schedule']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isAllDay: z.boolean().optional().default(false),
  recurrencePattern: z
    .object({
      type: z.enum(['weekly', 'monthly', 'work-schedule']),
      weekdays: z.array(z.number().min(1).max(7)).min(1).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
      shiftPattern: z.array(z.number().min(0).max(1)).min(2).optional(),
      startDate: z.string().date().optional(),
      shiftDuration: z.number().positive().optional(),
    })
    .optional(),
});

const CREATE_EVENT_BODY = CREATE_EVENT_BODY_BASE.refine(
  (data) => {
    if (data.recurrencePattern) {
      if (data.recurrencePattern.type === 'weekly' && !data.recurrencePattern.weekdays) return false;
      if (data.recurrencePattern.type === 'monthly' && !data.recurrencePattern.dayOfMonth) return false;
      if (
        data.recurrencePattern.type === 'work-schedule' &&
        (!data.recurrencePattern.shiftPattern || !data.recurrencePattern.startDate)
      )
        return false;
    }
    return true;
  },
  { message: 'Invalid recurrencePattern for eventType' },
);

const PATCH_EVENT_BODY_BASE = CREATE_EVENT_BODY_BASE.partial();

const PATCH_EVENT_BODY = PATCH_EVENT_BODY_BASE.refine(
  (data) => {
    if (data.recurrencePattern) {
      if (data.recurrencePattern.type === 'weekly' && !data.recurrencePattern.weekdays) return false;
      if (data.recurrencePattern.type === 'monthly' && !data.recurrencePattern.dayOfMonth) return false;
      if (
        data.recurrencePattern.type === 'work-schedule' &&
        (!data.recurrencePattern.shiftPattern || !data.recurrencePattern.startDate)
      )
        return false;
    }
    return true;
  },
  { message: 'Invalid recurrencePattern for eventType' },
);

const GET_LIST = {
  tags: ['Calendar'],
  params: z.object({
    groupId: z.string().uuid(),
  }),
  querystring: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    eventType: z.enum(['one-time', 'yearly', 'weekly', 'monthly', 'work-schedule']).optional(),
    search: z.string().max(100).optional(),
  }),
  response: createResponseSchema({
    200: z.array(CALENDAR_EVENT_SCHEMA),
  }),
};

const GET = {
  tags: ['Calendar'],
  params: z.object({
    groupId: z.string().uuid(),
    eventId: z.string().uuid(),
  }),
  response: createResponseSchema({
    200: CALENDAR_EVENT_SCHEMA,
  }),
};

const CREATE = {
  tags: ['Calendar'],
  params: z.object({
    groupId: z.string().uuid(),
  }),
  body: CREATE_EVENT_BODY,
  response: createResponseSchema({
    201: CALENDAR_EVENT_SCHEMA,
  }),
};

const UPDATE = {
  tags: ['Calendar'],
  params: z.object({
    groupId: z.string().uuid(),
    eventId: z.string().uuid(),
  }),
  body: PATCH_EVENT_BODY,
  response: createResponseSchema({
    200: CALENDAR_EVENT_SCHEMA,
  }),
};

const DELETE = {
  tags: ['Calendar'],
  params: z.object({
    groupId: z.string().uuid(),
    eventId: z.string().uuid(),
  }),
  querystring: z.object({
    deleteMode: z.enum(['single', 'all']).optional().default('single'),
  }),
  response: createResponseSchema({
    200: z.object({}),
  }),
};

export const SCHEMAS = Object.freeze({
  getList: GET_LIST,
  get: GET,
  create: CREATE,
  update: UPDATE,
  delete: DELETE,
});
