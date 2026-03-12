import { CONFIG, isProd, isDev } from '@/config';
import { CookieSerializeOptions } from '@fastify/cookie';

export const HEADER_NAME = Object.freeze({
  devHeaderOtpCode: 'X-Dev-Otp-Code',
  authorization: 'Authorization',
} as const);

export const REFRESH_TOKEN_COOKIE_CONFIG: CookieSerializeOptions = Object.freeze({
  httpOnly: true,
  secure: isProd(),
  sameSite: isProd(),
  maxAge: CONFIG.jwt.refresh.expiry / 1000,
  path: '/',
});
