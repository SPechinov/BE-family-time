/**
 * Global Jest setup file for integration tests
 * Handles test environment setup and teardown
 */

import { setupTestEnvironment, cleanupTestData, teardownTestEnvironment, TestContext } from './utils/test-setup';

// Extend Jest global namespace
declare global {
  var __TEST_CONTEXT__: TestContext | null;
}

// Initialize global test context
globalThis.__TEST_CONTEXT__ = null;

/**
 * Setup before all tests - creates DB connections, runs migrations, starts Fastify
 * Exported as default for Jest globalSetup
 */
const setup = async (): Promise<void> => {
  try {
    const context = await setupTestEnvironment();
    globalThis.__TEST_CONTEXT__ = context;
    console.log('Test environment initialized successfully');
  } catch (error) {
    console.error('Failed to initialize test environment:', error);
    throw error;
  }
};

/**
 * Teardown after all tests - closes connections, cleans up resources
 * Exported as default for Jest globalTeardown
 */
const teardown = async (): Promise<void> => {
  try {
    await teardownTestEnvironment();
    globalThis.__TEST_CONTEXT__ = null;
    console.log('Test environment cleaned up successfully');
  } catch (error) {
    console.error('Failed to cleanup test environment:', error);
    throw error;
  }
};

/**
 * Cleanup before each test - truncates all tables, flushes Redis
 */
export const beforeEachTest = async (): Promise<void> => {
  await cleanupTestData();
};

export default setup;
export { teardown };
