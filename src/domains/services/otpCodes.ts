export interface IOtpCodesService {
  saveCode(props: { code: string; key: string }): Promise<void>;
  getCode(props: { key: string }): Promise<string | null>;
  deleteCode(props: { key: string }): Promise<number>;
}
