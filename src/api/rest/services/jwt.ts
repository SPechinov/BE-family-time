import { UserId } from '@/entities';
import { FastifyInstance } from 'fastify';

export class JWTGenerator {
  #fastify: FastifyInstance;
  #expiresInAccess: number;
  #expiresInRefresh: number;

  constructor(props: { fastify: FastifyInstance; expiresInAccess: number; expiresInRefresh: number }) {
    this.#fastify = props.fastify;
    this.#expiresInAccess = props.expiresInAccess;
    this.#expiresInRefresh = props.expiresInRefresh;
  }

  generate({ userId, userAgent }: { userId: UserId; userAgent: string }) {
    return {
      access: this.#generateAccess({ userId, userAgent }),
      refresh: this.#generateRefresh({ userId, userAgent }),
    };
  }

  #generateAccess({ userId, userAgent }: { userId: UserId; userAgent: string }) {
    return this.#generateToken({ userId, userAgent, expiresIn: this.#expiresInAccess });
  }

  #generateRefresh({ userId, userAgent }: { userId: UserId; userAgent: string }) {
    return this.#generateToken({ userId, userAgent, expiresIn: this.#expiresInRefresh });
  }

  #generateToken(options: { userId: UserId; userAgent: string; expiresIn: number }): string {
    return this.#fastify.jwt.sign(
      { id: options.userId, userAgent: options.userAgent, createdAt: Date.now() },
      { expiresIn: options.expiresIn },
    );
  }
}
