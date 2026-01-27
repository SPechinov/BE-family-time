import { GLOBAL_SCHEMAS } from '@/api/rest/schemas';

describe('Global schemas validation test', () => {
  describe('FirstName validation', () => {
    it('firstName valid', () => {
      const result = GLOBAL_SCHEMAS.firstName.safeParse('Sigurd');
      expect(result.success).toBe(true);
    });

    it('firstName 2 chars', () => {
      const result = GLOBAL_SCHEMAS.firstName.safeParse('Ян');
      expect(result.success).toBe(true);
    });

    it('firstName max chars (40 chars)', () => {
      const result = GLOBAL_SCHEMAS.firstName.safeParse('a'.repeat(40));
      expect(result.success).toBe(true);
    });

    it('firstName 1 char', () => {
      const result = GLOBAL_SCHEMAS.firstName.safeParse('Y');
      expect(result.success).toBe(false);
    });

    it('firstName too long (41 chars)', () => {
      const result = GLOBAL_SCHEMAS.firstName.safeParse('a'.repeat(41));
      expect(result.success).toBe(false);
    });

    it('firstName empty', () => {
      const result = GLOBAL_SCHEMAS.firstName.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('Email validation', () => {
    it('email valid', () => {
      const result = GLOBAL_SCHEMAS.email.safeParse('test-email@test.test');
      expect(result.success).toBe(true);
    });

    it('email with +', () => {
      const result = GLOBAL_SCHEMAS.email.safeParse('email+1@email.com');
      expect(result.success).toBe(true);
    });

    it('email 254 chars', () => {
      const domain = '@test.com';
      const email = 'a'.repeat(254 - domain.length) + domain;
      const result = GLOBAL_SCHEMAS.email.safeParse(email);
      expect(result.success).toBe(true);
    });

    it('email with subdomain', () => {
      const result = GLOBAL_SCHEMAS.email.safeParse('test@mail.subdomain.com');
      expect(result.success).toBe(true);
    });

    it('email with numbers in domain', () => {
      const result = GLOBAL_SCHEMAS.email.safeParse('test@domain123.com');
      expect(result.success).toBe(true);
    });

    it('email too long (255 chars)', () => {
      const domain = '@test.com';
      const email = 'a'.repeat(255 - domain.length) + domain;
      const result = GLOBAL_SCHEMAS.email.safeParse(email);
      expect(result.success).toBe(false);
    });

    it('email with spaces', () => {
      const result = GLOBAL_SCHEMAS.email.safeParse('test @test.com');
      expect(result.success).toBe(false);
    });

    it('email empty', () => {
      const result = GLOBAL_SCHEMAS.email.safeParse('');
      expect(result.success).toBe(false);
    });

    it('email without dog and domain', () => {
      const result = GLOBAL_SCHEMAS.email.safeParse('test-email');
      expect(result.success).toBe(false);
    });

    it('email without domain', () => {
      const result = GLOBAL_SCHEMAS.email.safeParse('test-email@');
      expect(result.success).toBe(false);
    });

    it('email with short domain zone', () => {
      const result = GLOBAL_SCHEMAS.email.safeParse('test-email@test.c');
      expect(result.success).toBe(false);
    });

    it('email with domain zone (2 chars)', () => {
      const result = GLOBAL_SCHEMAS.email.safeParse('test-email@test.ru');
      expect(result.success).toBe(true);
    });
  });

  describe('Password validation', () => {
    it('password min length (8 chars)', () => {
      const result = GLOBAL_SCHEMAS.password.safeParse('a'.repeat(8));
      expect(result.success).toBe(true);
    });

    it('password max length (100 chars)', () => {
      const result = GLOBAL_SCHEMAS.password.safeParse('a'.repeat(100));
      expect(result.success).toBe(true);
    });

    it('password too short (7 chars)', () => {
      const result = GLOBAL_SCHEMAS.password.safeParse('a'.repeat(7));
      expect(result.success).toBe(false);
    });

    it('password too long (101 chars)', () => {
      const result = GLOBAL_SCHEMAS.password.safeParse('a'.repeat(101));
      expect(result.success).toBe(false);
    });

    it('password empty', () => {
      const result = GLOBAL_SCHEMAS.password.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('OTP code validation', () => {
    it('otpCode length (6 chars)', () => {
      const result = GLOBAL_SCHEMAS.otpCode(6).safeParse('123456');
      expect(result.success).toBe(true);
    });

    it('otpCode length (6 chars) too short (5 chars)', () => {
      const result = GLOBAL_SCHEMAS.otpCode(6).safeParse('12345');
      expect(result.success).toBe(false);
    });

    it('otpCode length (6 chars) too long (7 chars)', () => {
      const result = GLOBAL_SCHEMAS.otpCode(6).safeParse('1234567');
      expect(result.success).toBe(false);
    });

    it('otpCode empty', () => {
      const result = GLOBAL_SCHEMAS.otpCode(6).safeParse('');
      expect(result.success).toBe(false);
    });
  });
});
