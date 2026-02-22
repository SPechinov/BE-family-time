export interface IOtpCodesStore {
  set(props: { code: string; key: string }): Promise<void>;
  get(props: { key: string }): Promise<string | null>;
  delete(props: { key: string }): Promise<number>;
}
