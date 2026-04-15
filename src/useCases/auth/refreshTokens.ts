import { ITokensSessionsBlacklistStore, ITokensSessionsStore } from '@/domains/repositories/stores';
import { IJwtVerifier, ITokensSessionsGenerator } from '@/domains/services';
import { IRefreshTokensUseCase } from '@/domains/useCases';
import { SessionId, toSessionId, UserId } from '@/entities';
import { ErrorUnauthorized } from '@/pkg';

export class RefreshTokensUseCase implements IRefreshTokensUseCase {
  readonly #tokensSessionsStore: ITokensSessionsStore;
  readonly #tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;
  readonly #tokensSessionsGenerator: ITokensSessionsGenerator;
  readonly #jwtVerifier: IJwtVerifier;

  constructor(props: {
    tokensSessionsStore: ITokensSessionsStore;
    tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;
    tokensSessionsGenerator: ITokensSessionsGenerator;
    jwtVerifier: IJwtVerifier;
  }) {
    this.#tokensSessionsStore = props.tokensSessionsStore;
    this.#tokensSessionsBlacklistStore = props.tokensSessionsBlacklistStore;
    this.#tokensSessionsGenerator = props.tokensSessionsGenerator;
    this.#jwtVerifier = props.jwtVerifier;
  }

  async execute(
    props: Parameters<IRefreshTokensUseCase['execute']>[0],
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshPayload = this.#verifyRefreshTokenOrThrow(props.refreshToken);

    const currentSession = await this.#tokensSessionsStore.getSessionByRefreshJti({
      userId: refreshPayload.userId,
      refreshJti: refreshPayload.jti,
    });

    if (!currentSession || currentSession.userAgent !== props.userAgent) {
      throw new ErrorUnauthorized();
    }

    const tokens = this.#tokensSessionsGenerator.generateTokens({
      userId: refreshPayload.userId,
      userAgent: props.userAgent,
    });
    const newRefreshPayload = this.#verifyRefreshTokenOrThrow(tokens.refresh);
    const newAccessPayload = this.#verifyAccessTokenOrThrow(tokens.access);

    await this.#tokensSessionsBlacklistStore.addHashedAccessJtiToBlacklist({
      accessJtiHash: currentSession.accessJtiHash,
      expiresAt: currentSession.accessExpiresAt,
    });
    await this.#tokensSessionsStore.deleteSessionByRefreshJti({
      userId: refreshPayload.userId,
      refreshJti: refreshPayload.jti,
    });
    await this.#tokensSessionsStore.addSession({
      userId: newRefreshPayload.userId,
      sessionId: newRefreshPayload.sid,
      userAgent: props.userAgent,
      expiresAt: (newRefreshPayload.exp ?? Math.floor(Date.now() / 1000)) * 1000,
      refreshJti: newRefreshPayload.jti,
      accessJti: newAccessPayload.jti,
      accessExpiresAt: newAccessPayload.exp * 1000,
    });

    if (props.currentAccessToken) {
      const accessPayload = this.#verifyAccessToken(props.currentAccessToken);
      if (accessPayload) {
        await this.#tokensSessionsBlacklistStore.addAccessJtiToBlacklist({
          accessJti: accessPayload.jti,
          expiresAt: accessPayload.exp * 1000,
        });
      }
    }

    return {
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
    };
  }

  #verifyRefreshTokenOrThrow(token: string): { userId: UserId; sid: SessionId; jti: string; exp?: number } {
    const payload = this.#verifyTokenOrThrow(token, {
      type: 'refresh',
      requireUserId: true,
      requireSid: true,
      requireExp: false,
    });

    return { userId: payload.userId, sid: toSessionId(payload.sid), jti: payload.jti, exp: payload.exp };
  }

  #verifyAccessTokenOrThrow(token: string): { userId: UserId; sid: SessionId; jti: string; exp: number } {
    const payload = this.#verifyTokenOrThrow(token, {
      type: 'access',
      requireUserId: true,
      requireSid: true,
      requireExp: true,
    });
    if (payload.exp === undefined) throw new ErrorUnauthorized();

    return { userId: payload.userId, sid: toSessionId(payload.sid), jti: payload.jti, exp: payload.exp };
  }

  #verifyAccessToken(token: string): { jti: string; exp: number } | null {
    const payload = this.#verifyToken(token, {
      type: 'access',
      requireUserId: false,
      requireSid: false,
      requireExp: true,
    });
    if (!payload) return null;
    if (payload.exp === undefined) return null;
    return { jti: payload.jti, exp: payload.exp };
  }

  #verifyTokenOrThrow(
    token: string,
    props: {
      type: 'access' | 'refresh';
      requireUserId: boolean;
      requireSid: boolean;
      requireExp: boolean;
    },
  ):
    | { userId: UserId; sid: string; jti: string; exp: number }
    | { userId: UserId; sid: string; jti: string; exp?: number } {
    const payload = this.#verifyToken(token, props);
    if (!payload) throw new ErrorUnauthorized();
    return payload;
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
