export interface IJwtVerifier {
  verify<TPayload extends object>(token: string): TPayload;
}
