import { generateRandomEmail, request } from '../../utils';
import { URL_FORGOT_PASSWORD_START, URL_FORGOT_PASSWORD_END } from '../constants';
import { newUser } from '../utils';

describe('Registration test', () => {
  describe(`POST ${URL_FORGOT_PASSWORD_START}`, () => {
    it('valid email', async () => {
      const email = generateRandomEmail();
      const response = await request('POST', URL_FORGOT_PASSWORD_START, { email });
      expect(response.status).toBe(200);
    });

    it('check otp code', async () => {
      const email = generateRandomEmail();
      await newUser({ email });
      const response = await request('POST', URL_FORGOT_PASSWORD_START, { email });
      expect(response.status).toBe(200);

      const otpCode = response.headers.get('x-dev-otp-code');
      expect(otpCode).not.toBeUndefined();
      expect(otpCode?.length).toBe(6);
    });

    it('with implemented and not implemented params', async () => {
      const email = generateRandomEmail();
      const response = await request('POST', URL_FORGOT_PASSWORD_START, { email, tg: 'test-tg' });
      expect(response.status).toBe(200);
    });

    it('with empty email', async () => {
      const response = await request('POST', URL_FORGOT_PASSWORD_START, { email: '' });
      expect(response.status).toBe(422);
    });

    it('without email', async () => {
      const response = await request('POST', URL_FORGOT_PASSWORD_START);
      expect(response.status).toBe(422);
    });

    it('with not implemented params', async () => {
      const response = await request('POST', URL_FORGOT_PASSWORD_START, { tg: 'test-tg' });
      expect(response.status).toBe(422);
    });

    it('rate limit 3 times', async () => {
      const email = generateRandomEmail();
      const body = { email };
      await request('POST', URL_FORGOT_PASSWORD_START, body);
      await request('POST', URL_FORGOT_PASSWORD_START, body);
      const responseEnd = await request('POST', URL_FORGOT_PASSWORD_START, body);

      expect(responseEnd.status).toBe(200);
    });

    it('rate limit 4 times', async () => {
      const email = generateRandomEmail();
      const body = { email };
      await request('POST', URL_FORGOT_PASSWORD_START, body);
      await request('POST', URL_FORGOT_PASSWORD_START, body);
      await request('POST', URL_FORGOT_PASSWORD_START, body);
      const responseEnd = await request('POST', URL_FORGOT_PASSWORD_START, body);

      expect(responseEnd.status).toBe(429);
    });
  });

  describe(`POST ${URL_FORGOT_PASSWORD_END}`, () => {
    it('success update password', async () => {
      const email = generateRandomEmail();
      await newUser({ email });
      const responseStart = await request('POST', URL_FORGOT_PASSWORD_START, { email });
      const otpCode = responseStart.headers.get('x-dev-otp-code');
      const body = {
        email,
        otpCode,
        password: 'test-pass',
      };

      const responseEnd = await request('POST', URL_FORGOT_PASSWORD_END, body);
      expect(responseEnd.status).toBe(200);
    });

    it('rate limit 3 times', async () => {
      const body = {
        email: generateRandomEmail(),
        otpCode: '000000',
        password: 'test-pass',
      };

      await request('POST', URL_FORGOT_PASSWORD_END, body);
      await request('POST', URL_FORGOT_PASSWORD_END, body);
      const responseEnd = await request('POST', URL_FORGOT_PASSWORD_END, body);

      expect(responseEnd.status).toBe(400);
    });

    it('rate limit 4 times', async () => {
      const body = {
        email: generateRandomEmail(),
        otpCode: '000000',
        password: 'test-pass',
      };
      await request('POST', URL_FORGOT_PASSWORD_END, body);
      await request('POST', URL_FORGOT_PASSWORD_END, body);
      await request('POST', URL_FORGOT_PASSWORD_END, body);
      const responseEnd = await request('POST', URL_FORGOT_PASSWORD_END, body);

      expect(responseEnd.status).toBe(429);
    });
  });
});
