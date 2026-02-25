/**
 * Simple mock for @faker-js/faker to avoid ESM issues in Jest
 */

const randomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const randomNumeric = (length: number): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
};

const uuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const faker = {
  person: {
    firstName: () => randomString(8),
    lastName: () => randomString(10),
  },
  internet: {
    email: ({ firstName, lastName }: { firstName: string; lastName: string }) =>
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
  },
  phone: {
    number: () => `+1${randomNumeric(10)}`,
  },
  company: {
    name: () => `${randomString(6)} Inc.`,
  },
  lorem: {
    sentence: () => `${randomString(15)}.`,
  },
  string: {
    numeric: randomNumeric,
    uuid,
  },
};
