export interface IRateLimiterService {
  checkLimitOrThrow(props: { key: string }): Promise<void>;
}
