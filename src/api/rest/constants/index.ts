import { isProd } from '@/config';
import { CookieSerializeOptions } from '@fastify/cookie';

export const HEADER_NAME = Object.freeze({
  devHeaderOtpCode: 'X-Dev-Otp-Code',
  authorization: 'Authorization',
} as const);

export const COOKIE_NAME = Object.freeze({
  refreshToken: 'refreshToken',
} as const);

export const REFRESH_TOKEN_COOKIE_CONFIG: CookieSerializeOptions = Object.freeze({
  httpOnly: true,
  secure: isProd(),
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60,
  path: '/',
});
