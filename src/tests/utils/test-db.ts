import { Pool } from 'pg';

/**
 * Creates a test database connection with extended pool settings for parallel tests
 */
export const createTestDbConnection = (connectionString: string): Pool => {
  return new Pool({
    connectionString,
    max: 50,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });
};

/**
 * Truncates all tables in the test database (preserves schema)
 * Uses RESTART IDENTITY to reset sequences
 */
export const truncateAllTables = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Disable foreign key checks temporarily
    await client.query('SET CONSTRAINTS ALL DEFERRED');

    // Get all tables
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    const tables = tablesResult.rows.map((r) => r.tablename);

    // Truncate each table
    for (const table of tables) {
      await client.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Runs migrations on the test database
 */
export const runMigrations = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  try {
    // Read migration files
    const fs = await import('fs');
    const path = await import('path');

    const migrationsDir = path.join(process.cwd(), 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      // Extract UP migration (everything before "-- Down Migration")
      const upMigration = content.split('-- Down Migration')[0];

      await client.query(upMigration);
    }
  } finally {
    client.release();
  }
};

/**
 * Closes database connection pool
 */
export const closeDbConnection = async (pool: Pool): Promise<void> => {
  await pool.end();
};
