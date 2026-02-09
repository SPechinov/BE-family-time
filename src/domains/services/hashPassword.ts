import { ILogger } from '@/pkg';

export interface IHashPasswordService {
  hash(passwordPlain: string): Promise<string>;
  verify(props: { passwordPlain: string; passwordHashed: string; logger: ILogger }): Promise<boolean>;
}
