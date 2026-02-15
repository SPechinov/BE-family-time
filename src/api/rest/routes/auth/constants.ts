import { isProd } from '@/config';
import { CookieSerializeOptions } from '@fastify/cookie';

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
});

export const REFRESH_TOKEN_COOKIE_CONFIG: CookieSerializeOptions = {
  httpOnly: true,
  secure: isProd(),
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
};
