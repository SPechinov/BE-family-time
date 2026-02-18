export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/benchmarks/'],
  collectCoverageFrom: ['src/**/*.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^nanoid$': '<rootDir>/src/tests/__mocks__/nanoid.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(nanoid)/)',
  ],
  extensionsToTreatAsEsm: ['.ts'],
};