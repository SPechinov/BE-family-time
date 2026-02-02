import { generateRandomEmail, request } from '../../utils';
import { URL_REGISTRATION_END, URL_REGISTRATION_START } from '../constants';
import { newUser } from '../utils';

describe('Registration test', () => {
  describe(`POST ${URL_REGISTRATION_START}`, () => {
    it('valid email', async () => {
      const email = generateRandomEmail();
      const response = await request('POST', URL_REGISTRATION_START, { email });
      expect(response.status).toBe(200);
    });

    it('check otp code', async () => {
      const email = generateRandomEmail();
      const response = await request('POST', URL_REGISTRATION_START, { email });
      expect(response.status).toBe(200);

      const otpCode = response.headers.get('x-dev-otp-code');
      expect(otpCode).not.toBeUndefined();
      expect(otpCode?.length).toBe(6);
    });

    it('with implemented and not implemented params', async () => {
      const email = generateRandomEmail();
      const response = await request('POST', URL_REGISTRATION_START, { email, tg: 'test-tg' });
      expect(response.status).toBe(200);
    });

    it('with empty email', async () => {
      const response = await request('POST', URL_REGISTRATION_START, { email: '' });
      expect(response.status).toBe(422);
    });

    it('without email', async () => {
      const response = await request('POST', URL_REGISTRATION_START);
      expect(response.status).toBe(422);
    });

    it('with not implemented params', async () => {
      const response = await request('POST', URL_REGISTRATION_START, { tg: 'test-tg' });
      expect(response.status).toBe(422);
    });

    it('rate limit 3 times', async () => {
      const email = generateRandomEmail();
      const body = { email };
      await request('POST', URL_REGISTRATION_START, body);
      await request('POST', URL_REGISTRATION_START, body);
      const responseEnd = await request('POST', URL_REGISTRATION_START, body);

      expect(responseEnd.status).toBe(200);
    });

    it('rate limit 4 times', async () => {
      const email = generateRandomEmail();
      const body = { email };
      await request('POST', URL_REGISTRATION_START, body);
      await request('POST', URL_REGISTRATION_START, body);
      await request('POST', URL_REGISTRATION_START, body);
      const responseEnd = await request('POST', URL_REGISTRATION_START, body);

      expect(responseEnd.status).toBe(429);
    });
  });

  describe(`POST ${URL_REGISTRATION_END}`, () => {
    it('success create user', async () => {
      const email = generateRandomEmail();
      const responseStart = await request('POST', URL_REGISTRATION_START, { email });
      const otpCode = responseStart.headers.get('x-dev-otp-code');

      const responseEnd = await request('POST', URL_REGISTRATION_END, {
        email,
        otpCode,
        firstName: 'TestName',
        password: 'test-pass',
      });
      expect(responseEnd.status).toBe(201);
    });

    it('empty body', async () => {
      const email = generateRandomEmail();
      await request('POST', URL_REGISTRATION_START, { email });
      const responseEnd = await request('POST', URL_REGISTRATION_END);
      expect(responseEnd.status).toBe(422);
    });

    it('body without params', async () => {
      const email = generateRandomEmail();
      await request('POST', URL_REGISTRATION_START, { email });
      const responseEnd = await request('POST', URL_REGISTRATION_END, {});
      expect(responseEnd.status).toBe(422);
    });

    it('ivalid email', async () => {
      const emailStart = generateRandomEmail();
      const responseStart = await request('POST', URL_REGISTRATION_START, { email: emailStart });
      const otpCode = responseStart.headers.get('x-dev-otp-code');
      const emailEnd = generateRandomEmail();

      const responseEnd = await request<{ code: string }>('POST', URL_REGISTRATION_END, {
        email: emailEnd,
        otpCode,
        firstName: 'TestName',
        password: 'test-pass',
      });

      expect(responseEnd.status).toBe(400);
      expect(responseEnd.body).not.toBeUndefined();
      expect(responseEnd.body?.code).toBe('invalidCode');
    });

    it('invalid otp code', async () => {
      const email = generateRandomEmail();
      const responseStart = await request('POST', URL_REGISTRATION_START, { email });
      const otpCode = responseStart.headers.get('x-dev-otp-code') || 1;

      const invalidOtpCode = (999999 - +otpCode).toString().padStart(6, '0');
      const responseEnd = await request<{ code: string }>('POST', URL_REGISTRATION_END, {
        email,
        otpCode: invalidOtpCode,
        firstName: 'TestName',
        password: 'test-pass',
      });

      expect(responseEnd.status).toBe(400);
      expect(responseEnd.body).not.toBeUndefined();
      expect(responseEnd.body?.code).toBe('invalidCode');
    });

    it('double create user', async () => {
      const email = generateRandomEmail();
      const responseStart = await request('POST', URL_REGISTRATION_START, { email });
      const otpCode = responseStart.headers.get('x-dev-otp-code');
      const body = {
        email,
        otpCode,
        firstName: 'TestName',
        password: 'test-pass',
      };

      const [responseEnd1, responseEnd2] = await Promise.all([
        request<{ code: string }>('POST', URL_REGISTRATION_END, body),
        request<{ code: string }>('POST', URL_REGISTRATION_END, body),
      ]);

      expect(responseEnd1.status).toBe(201);
      expect(responseEnd2.status).toBe(400);
    });

    it('rate limit 3 times', async () => {
      const email = generateRandomEmail();
      const body = {
        email,
        otpCode: '000000',
        firstName: 'TestName',
        password: 'test-pass',
      };

      await request('POST', URL_REGISTRATION_END, body);
      await request('POST', URL_REGISTRATION_END, body);
      const responseEnd = await request<{ code: string }>('POST', URL_REGISTRATION_END, body);

      expect(responseEnd.status).toBe(400);
      expect(responseEnd.body).not.toBeUndefined();
      expect(responseEnd.body?.code).toBe('invalidCode');
    });

    it('rate limit 4 times', async () => {
      const email = generateRandomEmail();
      const body = {
        email,
        otpCode: '000000',
        firstName: 'TestName',
        password: 'test-pass',
      };

      await request('POST', URL_REGISTRATION_END, body);
      await request('POST', URL_REGISTRATION_END, body);
      await request('POST', URL_REGISTRATION_END, body);
      const responseEnd = await request('POST', URL_REGISTRATION_END, body);

      expect(responseEnd.status).toBe(429);
    });
  });

  it('user exists', async () => {
    const email = generateRandomEmail();
    newUser({ email });
    const dublicate = await request('POST', URL_REGISTRATION_START, { email });
    expect(dublicate.status).toBe(200);
  });
});
