import { z } from 'zod';

const DEFAULT_ERROR = Object.freeze({
  originalUrl: z.string(),
  timestamp: z.number(),
  message: z.string().nullish(),
});

export const RESPONSE_400 = z.object({
  ...DEFAULT_ERROR,
  statusCode: z.literal(400),
});

export const RESPONSE_422 = z.object({
  ...DEFAULT_ERROR,
  statusCode: z.literal(422),
  isValidationError: z.literal(true),
});

export const RESPONSE_500 = z.object({
  ...DEFAULT_ERROR,
  statusCode: z.literal(500),
});

export const getDefaultSchemaResponse = () => {
  return {
    400: RESPONSE_400,
    422: RESPONSE_422,
    500: RESPONSE_500,
  };
};
