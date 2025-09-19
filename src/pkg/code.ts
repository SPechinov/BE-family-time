export const generateNumericCode = (length: number) => {
  if (length <= 0) {
    throw new Error('Invalid code length, min 1 symbol');
  }

  if (length > 12) {
    throw new Error('Invalid code length, max 12 symbols');
  }

  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
};
