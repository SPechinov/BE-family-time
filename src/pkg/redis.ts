import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

export const REDIS_STATUS_SUCCESS_RESPONSE = 'OK';

export const newRedisConnection = async (props: {
  uri: string;
  onError?: (error: any) => void;
  onReady?: () => void;
}) => {
  const client = createClient({
    url: props.uri,
  });

  client.on('error', (error) => {
    props.onError?.(error);
  });

  client.on('ready', () => {
    props.onReady?.();
  });

  await client.connect();
  return client;
};
