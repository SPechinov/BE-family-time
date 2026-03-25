import { z } from 'zod';

const DEFAULT_ERROR = Object.freeze({
  originalUrl: z.string(),
  timestamp: z.number(),
  message: z.string().nullish(),
});

export const RESPONSE_400 = z.object({
  ...DEFAULT_ERROR,
  statusCode: z.literal(400),
  code: z.string(),
});

export const RESPONSE_401 = z.object({
  ...DEFAULT_ERROR,
  statusCode: z.literal(401),
  code: z.string(),
});

export const RESPONSE_422 = z.object({
  ...DEFAULT_ERROR,
  statusCode: z.literal(422),
});

export const RESPONSE_429 = z.object({
  ...DEFAULT_ERROR,
  statusCode: z.literal(429),
});

export const RESPONSE_500 = z.object({
  ...DEFAULT_ERROR,
  statusCode: z.literal(500),
});

export const API_ERROR_SCHEMA = z.union([RESPONSE_400, RESPONSE_401, RESPONSE_422, RESPONSE_429, RESPONSE_500]);

export type ApiError = z.infer<typeof API_ERROR_SCHEMA>;

export interface ApiErrorPayload {
  statusCode: number;
  originalUrl: string;
  timestamp: number;
  message?: string | null;
  code?: string;
}

export const DEFAULT_RESPONSE_SCHEMA = Object.freeze({
  400: RESPONSE_400,
  401: RESPONSE_401,
  422: RESPONSE_422,
  429: RESPONSE_429,
  500: RESPONSE_500,
});

export const createResponseSchema = <T>(customResponses: T) => {
  return {
    ...DEFAULT_RESPONSE_SCHEMA,
    ...customResponses,
  };
};
