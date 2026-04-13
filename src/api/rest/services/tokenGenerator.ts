import { UserId } from '@/entities';
import { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';

type TokenType = 'access' | 'refresh';

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
    const sessionId = randomUUID();

    return {
      access: this.#generateAccess({ userId, userAgent, sessionId }),
      refresh: this.#generateRefresh({ userId, userAgent, sessionId }),
    };
  }

  #generateAccess({ userId, userAgent, sessionId }: { userId: UserId; userAgent: string; sessionId: string }) {
    return this.#generateToken({ userId, userAgent, expiresIn: this.#accessExpiresIn, type: 'access', sessionId });
  }

  #generateRefresh({ userId, userAgent, sessionId }: { userId: UserId; userAgent: string; sessionId: string }) {
    return this.#generateToken({ userId, userAgent, expiresIn: this.#refreshExpiresIn, type: 'refresh', sessionId });
  }

  #generateToken(options: {
    userId: UserId;
    userAgent: string;
    expiresIn: number;
    type: TokenType;
    sessionId: string;
  }): string {
    return this.#fastify.jwt.sign(
      {
        userId: options.userId,
        userAgent: options.userAgent,
        createdAt: Date.now(),
        sid: options.sessionId,
        jti: randomUUID(),
        typ: options.type,
      },
      { expiresIn: options.expiresIn },
    );
  }
}
