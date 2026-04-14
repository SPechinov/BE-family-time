export interface IJwtSigner {
  sign<TPayload extends object>(payload: TPayload, options?: { expiresIn?: number | string }): string;
}
