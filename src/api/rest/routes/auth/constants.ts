export const PREFIX = '/auth';

export const ROUTES = Object.freeze({
  login: '/login',
  registrationStart: '/registration-start',
  registrationEnd: '/registration-end',
  forgotPasswordStart: '/forgot-password-start',
  forgotPasswordEnd: '/forgot-password-end',
  getAllSessions: '/get-all-sessions',
  logoutAllSessions: '/logout-all-sessions',
  logoutSession: '/logout-session',
  logoutSessionById: '/logout-session-by-id',
  refreshTokens: '/refresh-tokens',
});
