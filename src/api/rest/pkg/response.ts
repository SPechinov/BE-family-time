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

export const getDefaultSchemaResponse = () => {
  return {
    400: RESPONSE_400,
    401: RESPONSE_401,
    422: RESPONSE_422,
    429: RESPONSE_429,
    500: RESPONSE_500,
  };
};

export const createResponseSchema = (customResponses: Record<string | number, any> = {}) => {
  return {
    ...getDefaultSchemaResponse(),
    ...customResponses,
  };
};
