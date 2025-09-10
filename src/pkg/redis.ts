import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

export const REDIS_SUCCESS_RESPONSE = 'OK';

export const newRedis = async (props: { uri: string }) => {
  const client = createClient({
    url: props.uri,
  });

  await client.connect();
  return client;
};
