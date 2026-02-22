import { ILogger } from '@/pkg';

export type DefaultProps<T extends Record<string, unknown> = Record<string, never>> = {
  logger: ILogger;
} & T;
