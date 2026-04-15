import { IJwtVerifier, ITokensSessionsPayloadVerifier } from '@/domains/services';
import {
  SessionAccessTokenMeta,
  SessionAccessTokenPayload,
  SessionAccessTokenVerificationPayload,
  SessionRefreshTokenPayload,
  toSessionId,
  UserId,
} from '@/entities';
import { ErrorUnauthorized } from '@/pkg';

export class TokensSessionsPayloadVerifier implements ITokensSessionsPayloadVerifier {
  readonly #jwtVerifier: IJwtVerifier;

  constructor(props: { jwtVerifier: IJwtVerifier }) {
    this.#jwtVerifier = props.jwtVerifier;
  }

  verifyRefreshToken(token: string): SessionRefreshTokenPayload | null {
    const payload = this.#verifyToken(token, {
      type: 'refresh',
      requireUserId: true,
      requireSid: true,
      requireExp: false,
    });
    if (!payload) return null;

    return { userId: payload.userId, sid: toSessionId(payload.sid), jti: payload.jti, exp: payload.exp };
  }

  verifyRefreshTokenOrThrow(token: string): SessionRefreshTokenPayload {
    const payload = this.verifyRefreshToken(token);
    if (!payload) throw new ErrorUnauthorized();
    return payload;
  }

  verifyAccessToken(token: string): SessionAccessTokenVerificationPayload | null {
    const payload = this.#verifyToken(token, {
      type: 'access',
      requireUserId: false,
      requireSid: false,
      requireExp: true,
    });
    if (!payload || payload.exp === undefined) return null;

    return { jti: payload.jti, exp: payload.exp };
  }

  verifyAccessTokenOrThrow(token: string): SessionAccessTokenPayload {
    const payload = this.#verifyToken(token, {
      type: 'access',
      requireUserId: true,
      requireSid: true,
      requireExp: true,
    });
    if (!payload || payload.exp === undefined) throw new ErrorUnauthorized();

    return { userId: payload.userId, sid: toSessionId(payload.sid), jti: payload.jti, exp: payload.exp };
  }

  toSessionAccessTokenMeta(payload: SessionAccessTokenVerificationPayload): SessionAccessTokenMeta {
    return {
      jti: payload.jti,
      expiresAt: payload.exp * 1000,
    };
  }

  #verifyToken(
    token: string,
    props: {
      type: 'access' | 'refresh';
      requireUserId: boolean;
      requireSid: boolean;
      requireExp: boolean;
    },
  ):
    | { userId: UserId; sid: string; jti: string; exp: number }
    | { userId: UserId; sid: string; jti: string; exp?: number }
    | null {
    let payload;
    try {
      payload = this.#jwtVerifier.verify<{
        userId?: UserId;
        sid?: string;
        jti?: string;
        typ?: 'access' | 'refresh';
        exp?: number;
      }>(token);
    } catch {
      return null;
    }

    if (payload.typ !== props.type || !payload.jti) return null;
    if (props.requireUserId && !payload.userId) return null;
    if (props.requireSid && !payload.sid) return null;
    if (props.requireExp && !payload.exp) return null;

    return {
      userId: payload.userId as UserId,
      sid: payload.sid as string,
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}
