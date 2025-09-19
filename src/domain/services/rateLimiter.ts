export interface IRateLimiter {
  checkLimit(props: { key: string }): Promise<boolean>
}