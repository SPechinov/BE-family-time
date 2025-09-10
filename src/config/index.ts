import fs from 'fs';
import yaml from 'js-yaml';
import { z } from 'zod';

const ConfigSchema = z.object({
  server: z.object({
    port: z.number(),
  }),
  postgres: z.object({
    uri: z.string(),
  }),
  redis: z.object({
    uri: z.string(),
  }),
  ttls: z.object({
    registrationSec: z.number(),
  }),
  codesLength: z.object({
    registration: z.number(),
  }),
});

const loadFile = (uri: string) => {
  const envFile = fs.readFileSync(uri, 'utf8');
  return yaml.load(envFile) as unknown;
};

export type Config = z.infer<typeof ConfigSchema>;

export const CONFIG = (() => {
  const file = loadFile('config/env.yaml');

  const result = ConfigSchema.safeParse(file);
  if (!result.success) {
    console.error('Ошибка валидации конфигурации:', result.error.format());
    throw new Error('Конфигурация не валидна');
  }

  return result.data;
})();
