import { faker } from '../mocks/faker';

/**
 * User data for test fixtures
 */
export interface TestUserData {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
}

/**
 * Generates random user data for testing
 */
export const createUserFixture = (overrides?: Partial<TestUserData>): TestUserData => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    password: 'TestPassword123!',
    firstName,
    lastName,
    phone: faker.phone.number(),
    ...overrides,
  };
};

/**
 * Generates user data with specific email pattern
 */
export const createUserWithEmail = (email: string, overrides?: Partial<TestUserData>): TestUserData => {
  return {
    ...createUserFixture(),
    email,
    ...overrides,
  };
};

/**
 * Generates multiple unique user fixtures
 */
export const createMultipleUsers = (count: number): TestUserData[] => {
  return Array.from({ length: count }, (_, i) =>
    createUserFixture({
      email: `test.user.${i + 1}.${faker.string.uuid()}@example.com`,
    }),
  );
};

/**
 * Group data for test fixtures
 */
export interface TestGroupData {
  name: string;
  description?: string;
}

/**
 * Generates random group data for testing
 */
export const createGroupFixture = (overrides?: Partial<TestGroupData>): TestGroupData => {
  return {
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    ...overrides,
  };
};

/**
 * Generates multiple unique group fixtures
 */
export const createMultipleGroups = (count: number): TestGroupData[] => {
  return Array.from({ length: count }, () =>
    createGroupFixture({
      name: `${faker.company.name()} ${faker.string.uuid()}`,
    }),
  );
};

/**
 * OTP code fixture helper
 */
export const createOtpFixture = (length = 6): string => {
  return faker.string.numeric(length);
};

/**
 * Valid JWT-like token mock for testing
 */
export const createMockToken = (): string => {
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const randomBase64 = (length: number) => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += base64Chars.charAt(Math.floor(Math.random() * base64Chars.length));
    }
    return result;
  };
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${randomBase64(50)}.${randomBase64(50)}`;
};

/**
 * User-Agent strings for testing
 */
export const USER_AGENTS = {
  chrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  safari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  mobile:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
};
