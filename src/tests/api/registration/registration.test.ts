import { generateRandomEmail, request } from '../../utils';
const URL_REG_START = '/auth/registration-start';
const URL_REG_END = '/auth/registration-end';

describe('Registration test', () => {
  describe(`POST ${URL_REG_START}`, () => {
    it('valid email', async () => {
      const response = await request('POST', URL_REG_START, { email: 'test-email@test.test' });
      expect(response.status).toBe(200);
    });

    it('check otp code', async () => {
      const response = await request('POST', URL_REG_START, { email: 'test-email@test.test' });
      expect(response.status).toBe(200);

      const otpCode = response.headers.get('x-dev-otp-code');
      expect(otpCode).not.toBeUndefined();
      expect(otpCode?.length).toBe(6);
    });

    it('with implemented and not implemented params', async () => {
      const response = await request('POST', URL_REG_START, { email: 'test-email@test.com', tg: 'test-tg' });
      expect(response.status).toBe(200);
    });

    it('with empty email', async () => {
      const response = await request('POST', URL_REG_START, { email: '' });
      expect(response.status).toBe(422);
    });

    it('without email', async () => {
      const response = await request('POST', URL_REG_START);
      expect(response.status).toBe(422);
    });

    it('with not implemented params', async () => {
      const response = await request('POST', URL_REG_START, { tg: 'test-tg' });
      expect(response.status).toBe(422);
    });
  });

  describe(`POST ${URL_REG_END}`, () => {
    it('success create user', async () => {
      const email = generateRandomEmail();
      const responseStart = await request('POST', URL_REG_START, { email });
      const otpCode = responseStart.headers.get('x-dev-otp-code');

      const responseEnd = await request('POST', URL_REG_END, {
        email,
        otpCode,
        firstName: 'Sergei',
        password: 'test-pass',
      });
      expect(responseEnd.status).toBe(201);
    });

    it('empty body', async () => {
      const email = generateRandomEmail();
      await request('POST', URL_REG_START, { email });
      const responseEnd = await request('POST', URL_REG_END);
      expect(responseEnd.status).toBe(422);
    });

    it('body without params', async () => {
      const email = generateRandomEmail();
      await request('POST', URL_REG_START, { email });
      const responseEnd = await request('POST', URL_REG_END, {});
      expect(responseEnd.status).toBe(422);
    });

    it('ivalid email', async () => {
      const responseStart = await request('POST', URL_REG_START, { email: 'testinvalidemail@test.test' });
      const otpCode = responseStart.headers.get('x-dev-otp-code');
      const email = generateRandomEmail();

      const responseEnd = await request<{ code: string }>('POST', URL_REG_END, {
        email,
        otpCode,
        firstName: 'Sergei',
        password: 'test-pass',
      });

      expect(responseEnd.status).toBe(400);
      expect(responseEnd.body).not.toBeUndefined();
      expect(responseEnd.body?.code).toBe('invalidCode');
    });

    it('invalid otp code', async () => {
      const email = generateRandomEmail();
      const responseStart = await request('POST', URL_REG_START, { email });
      const otpCode = responseStart.headers.get('x-dev-otp-code') || 1;

      const invalidOtpCode = (999999 - +otpCode).toString().padStart(6, '0');
      const responseEnd = await request<{ code: string }>('POST', URL_REG_END, {
        email,
        otpCode: invalidOtpCode,
        firstName: 'Sergei',
        password: 'test-pass',
      });

      expect(responseEnd.status).toBe(400);
      expect(responseEnd.body).not.toBeUndefined();
      expect(responseEnd.body?.code).toBe('invalidCode');
    });

    it('rate limit 3 times', async () => {
      const email = generateRandomEmail();
      const body = {
        email,
        otpCode: '000000',
        firstName: 'Sergei',
        password: 'test-pass',
      };

      await request('POST', URL_REG_END, body);
      await request('POST', URL_REG_END, body);
      const responseEnd = await request<{ code: string }>('POST', URL_REG_END, body);

      expect(responseEnd.status).toBe(400);
      expect(responseEnd.body).not.toBeUndefined();
      expect(responseEnd.body?.code).toBe('invalidCode');
    });

    it('rate limit 4 times', async () => {
      const email = generateRandomEmail();
      const body = {
        email,
        otpCode: '000000',
        firstName: 'Sergei',
        password: 'test-pass',
      };

      await request('POST', URL_REG_END, body);
      await request('POST', URL_REG_END, body);
      await request('POST', URL_REG_END, body);
      const responseEnd = await request('POST', URL_REG_END, body);

      expect(responseEnd.status).toBe(429);
    });
  });
});
