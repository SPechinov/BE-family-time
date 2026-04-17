import { SessionTokenUnion, UserId } from '@/entities';
import { IJwtSigner, ITokensSessionsGenerator } from '@/domains/services';
import { randomUUID } from 'node:crypto';

export class TokensSessionsGenerator implements ITokensSessionsGenerator {
  readonly #jwtSigner: IJwtSigner;
  readonly #accessExpiresIn: number;
  readonly #refreshExpiresIn: number;

  constructor(props: { jwtSigner: IJwtSigner; expiresInAccess: number; expiresInRefresh: number }) {
    this.#jwtSigner = props.jwtSigner;
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
    type: SessionTokenUnion;
    sessionId: string;
  }): string {
    return this.#jwtSigner.sign(
      {
        userId: options.userId,
        userAgent: options.userAgent,
        sid: options.sessionId,
        jti: randomUUID(),
        typ: options.type,
      },
      { expiresIn: options.expiresIn },
    );
  }
}
