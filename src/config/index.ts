import fs from 'fs';
import yaml from 'js-yaml';
import { z } from 'zod';

const ConfigSchema = z.object({
  nodeEnv: z.enum(['local', 'development', 'production']),
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
    forgotPasswordSec: z.number(),
  }),
  codesLength: z.object({
    registration: z.number(),
    forgotPassword: z.number(),
  }),
  salts: z.object({
    hashCredentials: z.string().min(16),
    cryptoCredentials: z.string().min(1),
  }),
  jwt: z.object({
    accessTokenSecret: z.string().min(1),
    refreshTokenSecret: z.string().min(1),
    accessTokenExpiry: z.number(),
    refreshTokenExpiry: z.number(),
    issuer: z.string().min(1),
  }),
  cookie: z.object({
    secret: z.string().min(1),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

const loadFile = (uri: string): object => {
  const envFile = fs.readFileSync(uri, 'utf8');
  const fileData = yaml.load(envFile);

  if (typeof fileData !== 'object' || fileData === null) {
    throw new Error('Невалидный файл конфигурации');
  }

  return fileData;
};

export const CONFIG = ((): Config => {
  const file = loadFile('config/env.yaml');

  const result = ConfigSchema.safeParse(file);
  if (!result.success) {
    console.error('Ошибка валидации конфигурации:', result.error.format());
    throw new Error('Конфигурация не валидна');
  }

  return result.data;
})();

export const isProd = () => {
  return CONFIG.nodeEnv === 'production';
};

export const isDev = () => {
  return ['local', 'development'].includes(CONFIG.nodeEnv);
};
