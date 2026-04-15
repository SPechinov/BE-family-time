import { IJwtVerifier } from '@/domains/services';
import { FastifyInstance } from 'fastify';

export class FastifyJwtVerifier implements IJwtVerifier {
  readonly #fastify: FastifyInstance;

  constructor(props: { fastify: FastifyInstance }) {
    this.#fastify = props.fastify;
  }

  verify<TPayload extends object>(token: string): TPayload {
    return this.#fastify.jwt.verify<TPayload>(token);
  }
}
