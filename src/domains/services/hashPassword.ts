import { ILogger } from '@/pkg';

export interface IHashPasswordService {
  hash(passwordPlain: string): Promise<string>;
  verify(props: { password: string; hash: string; logger: ILogger }): Promise<boolean>;
}
