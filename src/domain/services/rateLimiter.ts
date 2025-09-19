export interface IRateLimiterService {
  checkLimit(props: { key: string }): Promise<boolean>
}