import z from 'zod';
import { createResponseSchema } from '../../utils';
import { FastifySchema } from 'fastify';

const SCHEMA_REGISTRATION_START: FastifySchema = {
  tags: ['Auth'],
  security: [],
  body: z.object({
    email: z.email().nonempty().describe('Email адрес'),
  }),
  response: createResponseSchema({
    200: z.undefined(),
  }),
};

export const AUTH_SCHEMAS: Record<string, FastifySchema> = Object.freeze({
  registrationStart: SCHEMA_REGISTRATION_START,
});
