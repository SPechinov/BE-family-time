export const isXss = (val: string) => {
  return !/<[^>]*>/.test(val);
};
