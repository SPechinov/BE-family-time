export const PREFIX = '/groups/:groupId/calendar';

export const ROUTES = {
  getList: '/events',
  get: '/events/:eventId',
  create: '/events',
  update: '/events/:eventId',
  delete: '/events/:eventId',
} as const;
