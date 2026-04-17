import { IJwtVerifier, ITokensSessionsPayloadVerifier } from '@/domains/services';
import { SessionTokenMeta, SessionTokenPayload, SessionUnion, toSessionId, UserId } from '@/entities';
import { ErrorUnauthorized } from '@/pkg';

export class TokensSessionsPayloadVerifier implements ITokensSessionsPayloadVerifier {
  readonly #jwtVerifier: IJwtVerifier;

  constructor(props: { jwtVerifier: IJwtVerifier }) {
    this.#jwtVerifier = props.jwtVerifier;
  }

  verifyRefreshTokenOrThrow(token: string): SessionTokenPayload {
    const payload = this.verifyRefreshToken(token);
    if (!payload) throw new ErrorUnauthorized();

    return payload;
  }

  verifyRefreshToken(token: string): SessionTokenPayload | null {
    return this.#verifyToken(token, { type: 'refresh' });
  }

  verifyAccessTokenOrThrow(token: string): SessionTokenPayload {
    const payload = this.verifyAccessToken(token);
    if (!payload) throw new ErrorUnauthorized();

    return payload;
  }

  verifyAccessToken(token: string): SessionTokenPayload | null {
    return this.#verifyToken(token, { type: 'access' });
  }

  toSessionAccessTokenMeta(payload: SessionTokenPayload): SessionTokenMeta {
    return {
      jti: payload.jti,
      expiresAt: payload.exp * 1000,
    };
  }

  #verifyToken(
    token: string,
    props: {
      type: SessionUnion;
    },
  ): SessionTokenPayload | null {
    let payload;
    try {
      payload = this.#jwtVerifier.verify<Partial<SessionTokenPayload>>(token);
    } catch {
      return null;
    }

    if (payload.typ !== props.type || !payload.jti || !payload.userId || !payload.sid || !payload.exp) {
      return null;
    }

    return {
      userId: payload.userId as UserId,
      sid: toSessionId(payload.sid),
      jti: payload.jti,
      exp: payload.exp,
      typ: payload.typ,
    };
  }
}
