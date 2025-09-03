import { createClient } from 'redis';

export const newRedis = async (props: { uri: string }) => {
  const client = createClient({
    url: props.uri,
  });

  await client.connect();
  return client;
};
