import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

export const REDIS_STATUS_SUCCESS_RESPONSE = 'OK';

export const newRedisConnection = async (props: { uri: string }) => {
  const client = createClient({
    url: props.uri,
  });

  client.on('error', (err) => {
    console.error('Redis ошибка:', err);
  });

  client.on('ready', () => {
    console.log('Redis подключен');
  });

  await client.connect();
  return client;
};
