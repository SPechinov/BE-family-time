import { LRUCache } from 'lru-cache';
import { CONFIG } from '@/config';

export class AccessTokensBlackList {
  #blackList = new LRUCache({
    ttl: CONFIG.jwt.access.expiry,
    ttlAutopurge: true,
  });

  add(token: string): void {
    this.#blackList.set(token, true);
  }

  has(token: string): boolean {
    return this.#blackList.has(token);
  }
}
