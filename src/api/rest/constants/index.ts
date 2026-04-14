import { CONFIG, isProd } from '@/config';
import { CookieSerializeOptions } from '@fastify/cookie';

export const HEADER_NAME = Object.freeze({
  devHeaderOtpCode: 'X-Dev-Otp-Code',
} as const);

export const ACCESS_TOKEN_COOKIE_CONFIG: CookieSerializeOptions = Object.freeze({
  httpOnly: true,
  secure: isProd(),
  sameSite: isProd() ? 'strict' : false,
  maxAge: CONFIG.jwt.access.expiry / 1000,
  path: '/',
});

export const REFRESH_TOKEN_COOKIE_CONFIG: CookieSerializeOptions = Object.freeze({
  httpOnly: true,
  secure: isProd(),
  sameSite: isProd() ? 'strict' : false,
  maxAge: CONFIG.jwt.refresh.expiry / 1000,
  path: '/',
});
