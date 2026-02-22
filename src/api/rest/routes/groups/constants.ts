export const PREFIX = '/groups';

export const ROUTES = Object.freeze({
  getList: '/',
  create: '/',
  get: '/:groupId',
  patch: '/:groupId',
  delete: '/:groupId',
  inviteUser: '/:groupId/inviteUser',
  excludeUser: '/:groupId/excludeUser',
});
