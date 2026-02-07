import { Pool } from 'pg';

export const newPostgresConnection = async (props: {
  uri: string;
  onError?: (error: any) => void;
  onReady?: () => void;
}) => {
  const pool = new Pool({
    connectionString: props.uri,
    max: 20,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
  });

  pool.on('error', (error) => {
    props.onError?.(error);
  });

  pool.on('connect', () => {
    props.onReady?.();
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
