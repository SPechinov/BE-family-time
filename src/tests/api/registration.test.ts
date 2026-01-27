import { request } from '../utils';
const URL_REG_START = '/auth/registration-start';

// https://www.npmjs.com/package/faker

describe('🦉 Auth Test', () => {
  describe(`POST ${URL_REG_START}`, () => {
    it('returns 200 with valid email', async () => {
      const response = await request('POST', URL_REG_START, { email: 'test-email@test.test' });
      expect(response.status).toBe(200);
    });

    it('returns 200 with valid email+1@email.com', async () => {
      const response = await request('POST', URL_REG_START, { email: 'test-email+1@test.test' });
      expect(response.status).toBe(200);
    });

    it('returns 200 email 254 length', async () => {
      const response = await request('POST', URL_REG_START, {
        email: 'a'.repeat(254 - '@test.com'.length) + '@test.com',
      });
      expect(response.status).toBe(200);
    });

    it('returns 200 email with subdomain', async () => {
      const response = await request('POST', URL_REG_START, {
        email: 'test@mail.subdomain.com',
      });
      expect(response.status).toBe(200);
    });

    it('returns 200 email with numbers in domain', async () => {
      const response = await request('POST', URL_REG_START, {
        email: 'test@domain123.com',
      });
      expect(response.status).toBe(200);
    });

    it('returns 422 email 255 length', async () => {
      const response = await request('POST', URL_REG_START, {
        email: 'a'.repeat(255 - '@test.com'.length) + '@test.com',
      });
      expect(response.status).toBe(422);
    });

    it('returns 422 with spaces in email', async () => {
      const response = await request('POST', URL_REG_START, {
        email: 'test @test.com',
      });
      expect(response.status).toBe(422);
    });

    it('returns 422 with empty email', async () => {
      const response = await request('POST', URL_REG_START, { email: '' });
      expect(response.status).toBe(422);
    });

    it('returns 422 with invalid email', async () => {
      const response = await request('POST', URL_REG_START, { email: 'test-email' });
      expect(response.status).toBe(422);
    });

    it('returns 422 without email', async () => {
      const response = await request('POST', URL_REG_START);
      expect(response.status).toBe(422);
    });

    it('returns 422 with not implemented params', async () => {
      const response = await request('POST', URL_REG_START, { tg: 'test-tg' });
      expect(response.status).toBe(422);
    });

    it('returns 422 with email and not implemented params', async () => {
      const response = await request('POST', URL_REG_START, { email: 'test-email', tg: 'test-tg' });
      expect(response.status).toBe(422);
    });
  });
});
