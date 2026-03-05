import { FastifyRequest } from 'fastify';
import { HEADER_NAME } from '../constants';

export const extractAuthToken = (request: FastifyRequest) => {
  const authHeader =
    request.headers[HEADER_NAME.authorization.toLowerCase()] || request.headers[HEADER_NAME.authorization];
  let token: string | undefined;

  if (typeof authHeader === 'string') {
    token = authHeader;
  }

  if (Array.isArray(authHeader) && authHeader[0]) {
    token = authHeader[0];
  }

  if (!token) return null;

  if (token.startsWith('Bearer ')) {
    return token.slice(7);
  }

  return token;
};
