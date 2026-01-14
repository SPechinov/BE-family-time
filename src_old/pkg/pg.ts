import { Pool } from 'pg';

export const newPg = async (props: { uri: string }) => {
  const pool = new Pool({
    connectionString: props.uri,
  });
  await pool.connect();
  return pool;
};
