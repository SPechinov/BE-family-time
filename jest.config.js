/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/benchmarks/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(nanoid|@faker-js/faker)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^nanoid$': '<rootDir>/src/tests/mocks/nanoid.ts',
    '^dompurify$': '<rootDir>/src/tests/mocks/dompurify.ts',
    '^jsdom$': '<rootDir>/src/tests/mocks/jsdom.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  injectGlobals: true,
  // Increased timeout for testcontainers startup (containers can take 30-60s to start)
  testTimeout: 120000,
  maxWorkers: 1,
  clearMocks: true,
};
