export const generateNumericCode = (length: number) => {
  if (length <= 0) {
    throw new Error('Invalid code length, min 1 symbol');
  }

  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
};
