export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/api/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
};