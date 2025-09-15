export interface IHashServiceConfig {
  salt: string;
}

export interface IHashService {
  hash(value: string, config: IHashServiceConfig): string;
}
