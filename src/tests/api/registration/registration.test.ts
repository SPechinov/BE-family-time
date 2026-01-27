import { request } from '../../utils';
const URL_REG_START = '/auth/registration-start';

describe('Auth test', () => {
  describe(`POST ${URL_REG_START}`, () => {
    it('returns 200 with valid email', async () => {
      const response = await request('POST', URL_REG_START, { email: 'test-email@test.test' });
      expect(response.status).toBe(200);
    });

    it('returns 200 with email and not implemented params', async () => {
      const response = await request('POST', URL_REG_START, { email: 'test-email@test.com', tg: 'test-tg' });
      expect(response.status).toBe(200);
    });

    it('returns 422 with empty email', async () => {
      const response = await request('POST', URL_REG_START, { email: '' });
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
  });
});
