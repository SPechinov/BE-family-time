/**
 * Mock for nanoid package in tests
 * Returns predictable IDs for testing
 */

let counter = 0;

export const nanoid = (size = 21): string => {
  counter++;
  return `test-id-${counter}-${'x'.repeat(size - 10)}`;
};

export const customAlphabet = (alphabet: string, defaultSize: number) => {
  return (size: number = defaultSize): string => {
    counter++;
    return `test-custom-${counter}-${'y'.repeat(size - 12)}`;
  };
};
