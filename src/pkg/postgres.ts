import { Pool } from 'pg';

export const newPostgresConnection = async (props: { uri: string }) => {
  const pool = new Pool({
    connectionString: props.uri,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('PostgreSQL ошибка:', err);
  });

  pool.on('connect', () => {
    console.log('PostgreSQL подключен');
  });

  try {
    const client = await pool.connect();
    client.release();
    return pool;
  } catch (error) {
    console.error('Ошибка подключения к PostgreSQL:', error);
    throw error;
  }
};
