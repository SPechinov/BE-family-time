export const HEADER_NAME = Object.freeze({
  devHeaderOtpCode: 'X-Dev-Otp-Code',
  authorization: 'Authorization',
} as const);

export const COOKIE_NAME = Object.freeze({
  refreshToken: 'refreshToken',
} as const);
