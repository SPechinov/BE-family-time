export const generateRandomEmail = () => {
  const randomNumbers = Array.from({ length: 50 }, () => Math.floor(Math.random() * 10)).join('');
  return `test+${randomNumbers}@test.test`;
};
