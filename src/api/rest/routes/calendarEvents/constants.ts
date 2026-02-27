export const PREFIX = '/groups/:groupId/calendar-events';

export const ROUTES = {
  getList: '/',
  get: '/:calendarEventId',
  create: '/',
  patch: '/:calendarEventId',
  delete: '/:calendarEventId',
} as const;
