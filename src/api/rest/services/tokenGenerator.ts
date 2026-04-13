import { UserId } from '@/entities';
import { FastifyInstance } from 'fastify';

export class TokenGenerator {
  readonly #fastify: FastifyInstance;
  readonly #accessExpiresIn: number;
  readonly #refreshExpiresIn: number;

  constructor(props: { fastify: FastifyInstance; expiresInAccess: number; expiresInRefresh: number }) {
    this.#fastify = props.fastify;
    this.#accessExpiresIn = props.expiresInAccess;
    this.#refreshExpiresIn = props.expiresInRefresh;
  }

  generateTokens({ userId, userAgent }: { userId: UserId; userAgent: string }) {
    return {
      access: this.#generateAccess({ userId, userAgent }),
      refresh: this.#generateRefresh({ userId, userAgent }),
    };
  }

  #generateAccess({ userId, userAgent }: { userId: UserId; userAgent: string }) {
    return this.#generateToken({ userId, userAgent, expiresIn: this.#accessExpiresIn });
  }

  #generateRefresh({ userId, userAgent }: { userId: UserId; userAgent: string }) {
    return this.#generateToken({ userId, userAgent, expiresIn: this.#refreshExpiresIn });
  }

  #generateToken(options: { userId: UserId; userAgent: string; expiresIn: number }): string {
    return this.#fastify.jwt.sign(
      { id: options.userId, userAgent: options.userAgent, createdAt: Date.now() },
      { expiresIn: options.expiresIn },
    );
  }
}
