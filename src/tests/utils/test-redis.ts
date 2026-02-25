import { createClient } from 'redis';

/**
 * Test Redis client type (using any to avoid version conflicts)
 */
export type TestRedisClient = ReturnType<typeof createClient>;

/**
 * Creates a test Redis client connection
 */
export const createTestRedisConnection = async (connectionString: string): Promise<TestRedisClient> => {
  const client = createClient({
    url: connectionString,
  });

  client.on('error', (error) => {
    console.error('Redis error:', error);
  });

  await client.connect();
  return client;
};

/**
 * Flushes all keys in the test Redis database
 */
export const flushRedis = async (client: TestRedisClient): Promise<void> => {
  await client.flushDb();
};

/**
 * Closes Redis connection
 */
export const closeRedisConnection = async (client: TestRedisClient): Promise<void> => {
  await client.quit();
};
