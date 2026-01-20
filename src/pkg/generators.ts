export const generateNumericCode = (length: number) => {
  if (length < 1) {
    throw new Error('Минимальная длина кода 1 символ');
  }

  if (length > 20) {
    throw new Error('Максимальная длина кода 20 символов');
  }

  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
};
