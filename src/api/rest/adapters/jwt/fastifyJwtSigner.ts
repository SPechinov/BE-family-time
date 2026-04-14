import { IJwtSigner } from '@/domains/services';
import { FastifyInstance } from 'fastify';

export class FastifyJwtSigner implements IJwtSigner {
  readonly #fastify: FastifyInstance;

  constructor(props: { fastify: FastifyInstance }) {
    this.#fastify = props.fastify;
  }

  sign<TPayload extends object>(payload: TPayload, options?: { expiresIn?: number | string }): string {
    return this.#fastify.jwt.sign(payload, options);
  }
}
