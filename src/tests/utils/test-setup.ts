import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { newApiRest } from '../../api/rest/index.js';
import { Logger } from '../../pkg/logger.js';
import { createTestDbConnection, runMigrations, truncateAllTables, closeDbConnection } from './test-db.js';
import { createTestRedisConnection, flushRedis, closeRedisConnection, TestRedisClient } from './test-redis.js';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';

/**
 * Global test context shared across test suite
 */
export interface TestContext {
  fastify: FastifyInstance;
  postgres: Pool;
  redis: TestRedisClient;
  logger: InstanceType<typeof Logger>;
  postgresContainer?: StartedPostgreSqlContainer;
  redisContainer?: StartedRedisContainer;
}

/**
 * Global container instances - started once for all tests
 */
let postgresContainer: StartedPostgreSqlContainer | null = null;
let redisContainer: StartedRedisContainer | null = null;

let globalContext: TestContext | null = null;

/**
 * Sets up test environment with testcontainers PostgreSQL and Redis
 * Called once before all tests in the suite
 */
export const setupTestEnvironment = async (): Promise<TestContext> => {
  if (globalContext) {
    return globalContext;
  }

  // Start PostgreSQL container
  postgresContainer = await new PostgreSqlContainer('postgres:16.3')
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .start();

  // Start Redis container
  redisContainer = await new RedisContainer('redis:7.4').withPassword('test').start();

  // Get connection strings from containers
  const postgresUri = postgresContainer.getConnectionUri();
  const redisPassword = 'test';
  const redisUri = `redis://default:${redisPassword}@${redisContainer.getHost()}:${redisContainer.getPort()}`;

  // Create connections
  const postgres = createTestDbConnection(postgresUri);
  const redis = await createTestRedisConnection(redisUri);
  const logger = new Logger({
    level: 'silent',
  });

  // Run migrations
  await runMigrations(postgres);

  // Create Fastify instance
  const fastify = await newApiRest({
    postgres,
    redis,
    logger,
  });

  globalContext = {
    fastify,
    postgres,
    redis,
    logger,
    postgresContainer,
    redisContainer,
  };

  return globalContext;
};

/**
 * Cleans up test data between tests
 * Called after each test
 */
export const cleanupTestData = async (): Promise<void> => {
  if (!globalContext) return;

  await truncateAllTables(globalContext.postgres);
  await flushRedis(globalContext.redis);
};

/**
 * Tears down test environment
 * Called once after all tests in the suite
 */
export const teardownTestEnvironment = async (): Promise<void> => {
  if (!globalContext) return;

  await globalContext.fastify.close();
  await closeRedisConnection(globalContext.redis);
  await closeDbConnection(globalContext.postgres);

  // Stop containers
  if (postgresContainer) {
    await postgresContainer.stop();
    postgresContainer = null;
  }

  if (redisContainer) {
    await redisContainer.stop();
    redisContainer = null;
  }

  globalContext = null;
};

/**
 * Creates a new test context with isolated Fastify instance
 * Useful for parallel test execution
 */
export const createIsolatedTestContext = async (): Promise<TestContext> => {
  const { postgres, redis, logger } = await setupTestEnvironment();

  const fastify = await newApiRest({
    postgres,
    redis,
    logger,
  });

  return { fastify, postgres, redis, logger };
};

/**
 * Destroys isolated test context
 */
export const destroyIsolatedTestContext = async (context: TestContext): Promise<void> => {
  await context.fastify.close();
};

/**
 * Cleanup before each test - truncates all tables, flushes Redis
 * Exported for use in jest-setup.ts
 */
export const beforeEachTest = async (): Promise<void> => {
  if (globalContext) {
    await truncateAllTables(globalContext.postgres);
    await flushRedis(globalContext.redis);
  }
};
