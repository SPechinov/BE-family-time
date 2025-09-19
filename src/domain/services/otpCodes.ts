export interface IOtpCodesService {
  saveCode(props: { code: string; credential: string }): Promise<void>;
  getCode(props: { credential: string }): Promise<string | null>;
  deleteCode(props: { credential: string }): Promise<number>;
}