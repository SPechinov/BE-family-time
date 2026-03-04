import { RedisClient } from '@/pkg';

export class Store {
  #redis: RedisClient;

  constructor(props: { redis: RedisClient }) {
    this.#redis = props.redis;
  }
}
