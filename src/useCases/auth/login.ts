import { ITokensSessionsStore } from '@/domains/repositories/stores';
import { IJwtVerifier, ITokensSessionsGenerator } from '@/domains/services';
import { IAuthUseCases, ILoginUseCase } from '@/domains/useCases';
import { SessionId, toSessionId, UserId } from '@/entities';
import { ErrorUnauthorized } from '@/pkg';

export class LoginUseCase implements ILoginUseCase {
  readonly #authUseCases: IAuthUseCases;
  readonly #tokensSessionsGenerator: ITokensSessionsGenerator;
  readonly #tokensSessionsStore: ITokensSessionsStore;
  readonly #jwtVerifier: IJwtVerifier;

  constructor(props: {
    authUseCases: IAuthUseCases;
    tokensSessionsGenerator: ITokensSessionsGenerator;
    tokensSessionsStore: ITokensSessionsStore;
    jwtVerifier: IJwtVerifier;
  }) {
    this.#authUseCases = props.authUseCases;
    this.#tokensSessionsGenerator = props.tokensSessionsGenerator;
    this.#tokensSessionsStore = props.tokensSessionsStore;
    this.#jwtVerifier = props.jwtVerifier;
  }

  async execute(
    props: Parameters<ILoginUseCase['execute']>[0],
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { user } = await this.#authUseCases.login({
      logger: props.logger,
      userContactsPlainEntity: props.userContactsPlainEntity,
      userPasswordPlainEntity: props.userPasswordPlainEntity,
      jwtPayload: { userAgent: props.userAgent },
    });

    const tokens = this.#tokensSessionsGenerator.generateTokens({
      userId: user.id,
      userAgent: props.userAgent,
    });
    const refreshPayload = this.#verifyRefreshTokenOrThrow(tokens.refresh);
    const accessPayload = this.#verifyAccessTokenOrThrow(tokens.access);

    await this.#tokensSessionsStore.addSession({
      userId: refreshPayload.userId,
      sessionId: refreshPayload.sid,
      userAgent: props.userAgent,
      expiresAt: (refreshPayload.exp ?? Math.floor(Date.now() / 1000)) * 1000,
      refreshJti: refreshPayload.jti,
      accessJti: accessPayload.jti,
      accessExpiresAt: accessPayload.exp * 1000,
    });

    return {
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
    };
  }

  #verifyRefreshTokenOrThrow(token: string): {
    userId: UserId;
    sid: SessionId;
    jti: string;
    exp?: number;
  } {
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
      throw new ErrorUnauthorized();
    }

    if (!payload.userId || payload.typ !== 'refresh' || !payload.sid || !payload.jti) {
      throw new ErrorUnauthorized();
    }

    return { userId: payload.userId, sid: toSessionId(payload.sid), jti: payload.jti, exp: payload.exp };
  }

  #verifyAccessTokenOrThrow(token: string): { userId: UserId; sid: SessionId; jti: string; exp: number } {
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
      throw new ErrorUnauthorized();
    }

    if (!payload.userId || payload.typ !== 'access' || !payload.sid || !payload.jti || !payload.exp) {
      throw new ErrorUnauthorized();
    }

    return { userId: payload.userId, sid: toSessionId(payload.sid), jti: payload.jti, exp: payload.exp };
  }
}
