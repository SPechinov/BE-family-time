import { ServerError } from '@/api/rest/errors';

export const generateNumericCode = (length: number) => {
  if (length <= 0) {
    throw new ServerError({ message: 'Invalid code length, min 1 symbol' });
  }

  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
};
