import { SessionTokenPayload, SessionTokenUnion, toSessionId, UserId } from '@/entities';
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
    const accessJti = randomUUID();
    const refreshJti = randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);

    const accessTokenPayload: SessionTokenPayload = {
      userId,
      sid: toSessionId(sessionId),
      jti: accessJti,
      exp: nowSec + this.#accessExpiresIn,
      typ: 'access',
    };

    const refreshTokenPayload: SessionTokenPayload = {
      userId,
      sid: toSessionId(sessionId),
      jti: refreshJti,
      exp: nowSec + this.#refreshExpiresIn,
      typ: 'refresh',
    };

    const accessToken = this.#generateToken({
      userId,
      userAgent,
      sessionId,
      jti: accessJti,
      expiresIn: this.#accessExpiresIn,
      type: 'access',
    });

    const refreshToken = this.#generateToken({
      userId,
      userAgent,
      sessionId,
      jti: refreshJti,
      expiresIn: this.#refreshExpiresIn,
      type: 'refresh',
    });

    return {
      accessToken,
      refreshToken,
      accessTokenPayload,
      refreshTokenPayload,
    };
  }

  #generateToken(options: {
    userId: UserId;
    userAgent: string;
    expiresIn: number;
    type: SessionTokenUnion;
    sessionId: string;
    jti: string;
  }): string {
    return this.#jwtSigner.sign(
      {
        userId: options.userId,
        userAgent: options.userAgent,
        sid: options.sessionId,
        jti: options.jti,
        typ: options.type,
      },
      { expiresIn: options.expiresIn },
    );
  }
}
