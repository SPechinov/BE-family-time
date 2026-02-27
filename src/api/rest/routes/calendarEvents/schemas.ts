import { z } from 'zod';
import { createResponseSchema } from '../../utils';
import { CALENDAR_EVENT_SCHEMA, GLOBAL_SCHEMAS } from '../../schemas';

const GET_LIST = {
  tags: ['Calendar events'],
  params: z.object({
    groupId: GLOBAL_SCHEMAS.groupId,
  }),
  querystring: z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    eventType: GLOBAL_SCHEMAS.calendarEventType.optional(),
  }),
  response: createResponseSchema({
    200: z.array(CALENDAR_EVENT_SCHEMA),
  }),
};

const GET = {
  tags: ['Calendar events'],
  params: z.object({
    groupId: GLOBAL_SCHEMAS.groupId,
    calendarEventId: z.uuidv4(),
  }),
  response: createResponseSchema({
    200: CALENDAR_EVENT_SCHEMA,
  }),
};

const CREATE = {
  tags: ['Calendar events'],
  params: z.object({
    groupId: GLOBAL_SCHEMAS.groupId,
  }),
  body: z.object({
    title: GLOBAL_SCHEMAS.calendarEventTitle,
    description: GLOBAL_SCHEMAS.calendarEventDescription.optional(),
    eventType: GLOBAL_SCHEMAS.calendarEventType,
    iterationType: GLOBAL_SCHEMAS.calendarEventIterationType,
    recurrencePattern: GLOBAL_SCHEMAS.calendarEventRecurrencePattern.optional(),
    startDate: z.date(),
    endDate: z.date().optional(),
  }),
  response: createResponseSchema({
    201: CALENDAR_EVENT_SCHEMA,
  }),
};

const PATCH = {
  tags: ['Calendar events'],
  params: z.object({
    groupId: GLOBAL_SCHEMAS.groupId,
    calendarEventId: GLOBAL_SCHEMAS.calendarEventId,
  }),
  body: z.object({
    title: GLOBAL_SCHEMAS.calendarEventTitle,
    description: GLOBAL_SCHEMAS.calendarEventDescription.optional(),
  }),
  response: createResponseSchema({
    200: CALENDAR_EVENT_SCHEMA,
  }),
};

const DELETE = {
  tags: ['Calendar events'],
  params: z.object({
    groupId: GLOBAL_SCHEMAS.groupId,
    calendarEventId: GLOBAL_SCHEMAS.calendarEventId,
  }),
  response: createResponseSchema({
    200: z.void(),
  }),
};

export const SCHEMAS = Object.freeze({
  getList: GET_LIST,
  get: GET,
  create: CREATE,
  patch: PATCH,
  delete: DELETE,
});
