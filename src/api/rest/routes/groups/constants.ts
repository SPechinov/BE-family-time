export const PREFIX = '/groups';

export const ROUTES = Object.freeze({
  getList: '/',
  create: '/',
  get: '/:id',
  patch: '/:id',
  delete: '/:id',
  inviteUser: '/:id/inviteUser',
  excludeUser: '/:id/excludeUser',
});
