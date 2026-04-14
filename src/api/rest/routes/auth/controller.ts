import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AUTH_SCHEMAS } from './schemas';
import { IAuthUseCases } from '@/domains/useCases';
import {
  UserContactsPlainEntity,
  UserCreatePlainEntity,
  UserPasswordPlainEntity,
  UserPersonalInfoPlainEntity,
  UserId,
} from '@/entities';
import { CONFIG, isDev } from '@/config';
import { HEADER_NAME, REFRESH_TOKEN_COOKIE_CONFIG } from '../../constants';
import { ErrorInvalidUserAgent, ErrorUnauthorized, ErrorUserNotExists, RedisClient } from '@/pkg';
import { PREFIX, ROUTES } from './constants';
import { TokenGenerator, TokenStore } from '../../services';
import { extractAuthToken } from '../../utils';

export class AuthRoutesController {
  #fastify: FastifyInstance;
  #useCases: IAuthUseCases;
  #tokenGenerator: TokenGenerator;
  #tokenStore: TokenStore;

  constructor(props: { fastify: FastifyInstance; useCases: IAuthUseCases; redis: RedisClient }) {
    this.#fastify = props.fastify;
    this.#useCases = props.useCases;

    this.#tokenGenerator = new TokenGenerator({
      fastify: this.#fastify,
      expiresInAccess: CONFIG.jwt.access.expiry / 1000,
      expiresInRefresh: CONFIG.jwt.refresh.expiry / 1000,
    });
    this.#tokenStore = new TokenStore({
      redis: props.redis,
      sessionsIndexTtlSec: CONFIG.jwt.refresh.expiry / 1000,
    });
  }

  register() {
    this.#fastify.register(
      (instance: FastifyInstance) => {
        const router = instance.withTypeProvider<ZodTypeProvider>();

        router.post(
          ROUTES.login,
          {
            schema: AUTH_SCHEMAS.login,
          },
          async (request, reply) => {
            const userAgent = this.#extractUserAgentOrThrow(request);

            const { user } = await this.#useCases.login({
              logger: request.log,
              userContactsPlainEntity: new UserContactsPlainEntity({
                email: request.body.email,
              }),
              userPasswordPlainEntity: new UserPasswordPlainEntity(request.body.password),
              jwtPayload: { userAgent },
            });

            const tokens = this.#tokenGenerator.generateTokens({
              userId: user.id,
              userAgent,
            });
            const refreshPayload = this.#verifyRefreshTokenOrThrow(tokens.refresh);

            await this.#tokenStore.createSession({
              userId: refreshPayload.userId,
              sessionId: refreshPayload.sid,
              userAgent,
              expiresAt: (refreshPayload.exp ?? Math.floor(Date.now() / 1000)) * 1000,
              refreshJti: refreshPayload.jti,
            });

            this.#setAccessTokenToHeaders(reply, tokens.access);
            this.#setRefreshTokenToCookie(reply, tokens.refresh);

            reply.status(200).send();
          },
        );

        router.post(
          ROUTES.registrationStart,
          {
            schema: AUTH_SCHEMAS.registrationStart,
          },
          async (request, reply) => {
            const result = await this.#useCases.registrationStart({
              logger: request.log,
              userContactsPlainEntity: new UserContactsPlainEntity({ email: request.body.email }),
            });
            if (isDev()) {
              reply.header(HEADER_NAME.devHeaderOtpCode, result.otpCode);
            }
            reply.status(200).send();
          },
        );

        router.post(
          ROUTES.registrationEnd,
          {
            schema: AUTH_SCHEMAS.registrationEnd,
          },
          async (request, reply) => {
            await this.#useCases.registrationEnd({
              logger: request.log,
              otpCode: request.body.otpCode,
              userCreatePlainEntity: new UserCreatePlainEntity({
                timeZone: request.body.timeZone,
                language: request.body.language,
                contactsPlain: new UserContactsPlainEntity({ email: request.body.email }),
                personalInfoPlain: new UserPersonalInfoPlainEntity({
                  firstName: request.body.firstName,
                }),
                passwordPlain: new UserPasswordPlainEntity(request.body.password),
              }),
            });
            reply.status(201).send();
          },
        );

        router.post(
          ROUTES.forgotPasswordStart,
          {
            schema: AUTH_SCHEMAS.forgotPasswordStart,
          },
          async (request, reply) => {
            try {
              const { otpCode } = await this.#useCases.forgotPasswordStart({
                logger: request.log,
                userContactsPlainEntity: new UserContactsPlainEntity({ email: request.body.email }),
              });

              if (isDev()) {
                reply.header(HEADER_NAME.devHeaderOtpCode, otpCode);
              }
              reply.status(200).send();
            } catch (error: unknown) {
              if (error instanceof ErrorUserNotExists) {
                reply.status(200).send();
                return;
              }
              throw error;
            }
          },
        );

        router.post(
          ROUTES.forgotPasswordEnd,
          {
            schema: AUTH_SCHEMAS.forgotPasswordEnd,
          },
          async (request, reply) => {
            try {
              await this.#useCases.forgotPasswordEnd({
                logger: request.log,
                userContactsPlainEntity: new UserContactsPlainEntity({ email: request.body.email }),
                otpCode: request.body.otpCode,
                password: new UserPasswordPlainEntity(request.body.password),
              });

              reply.status(200).send();
            } catch (error: unknown) {
              if (error instanceof ErrorUserNotExists) {
                reply.status(200).send();
                return;
              }
              throw error;
            }
          },
        );

        router.get(
          ROUTES.getAllSessions,
          {
            schema: AUTH_SCHEMAS.getAllSession,
          },
          async (request, reply) => {
            const refreshToken = this.#getRefreshToken(request);
            if (!refreshToken) throw new ErrorUnauthorized();

            const payload = this.#verifyRefreshTokenOrThrow(refreshToken);
            const currentSession = await this.#tokenStore.getSessionByRefreshJti({
              userId: payload.userId,
              refreshJti: payload.jti,
            });

            if (!currentSession) {
              throw new ErrorUnauthorized();
            }

            const sessions = await this.#tokenStore.getUserSessions({
              userId: payload.userId,
              currentSessionId: payload.sid,
            });

            reply.status(200).send({
              sessions: sessions.map((session: { expiresAt: number; userAgent: string; isCurrent: boolean }) => ({
                expiresAt: session.expiresAt,
                userAgent: session.userAgent,
                isCurrent: session.isCurrent,
              })),
            });
          },
        );

        router.post(
          ROUTES.logoutAllSessions,
          {
            schema: AUTH_SCHEMAS.logoutAllSession,
          },
          async (request, reply) => {
            const refreshToken = this.#getRefreshToken(request);
            if (!refreshToken) throw new ErrorUnauthorized();

            const payload = this.#verifyRefreshTokenOrThrow(refreshToken);
            const currentSession = await this.#tokenStore.getSessionByRefreshJti({
              userId: payload.userId,
              refreshJti: payload.jti,
            });
            if (!currentSession) throw new ErrorUnauthorized();

            await this.#tokenStore.deleteAllSessions({ userId: payload.userId });
            await this.#tryBlacklistAccessToken(request);
            this.#removeRefreshTokenFromCookie(reply);

            reply.status(200).send();
          },
        );

        router.post(
          ROUTES.logoutSession,
          {
            schema: AUTH_SCHEMAS.logoutSession,
          },
          async (request, reply) => {
            const refreshToken = this.#getRefreshToken(request);
            if (!refreshToken) throw new ErrorUnauthorized();

            const payload = this.#verifyRefreshTokenOrThrow(refreshToken);
            const currentSession = await this.#tokenStore.getSessionByRefreshJti({
              userId: payload.userId,
              refreshJti: payload.jti,
            });
            if (!currentSession) throw new ErrorUnauthorized();

            await this.#tokenStore.deleteSessionByRefreshJti({
              userId: payload.userId,
              refreshJti: payload.jti,
            });
            await this.#tryBlacklistAccessToken(request);
            this.#removeRefreshTokenFromCookie(reply);

            reply.status(200).send();
          },
        );

        router.post(
          ROUTES.refreshTokens,
          {
            schema: AUTH_SCHEMAS.refreshTokens,
          },
          async (request, reply) => {
            const refreshToken = this.#getRefreshToken(request);
            if (!refreshToken) throw new ErrorUnauthorized();

            const userAgent = this.#extractUserAgentOrThrow(request);
            const payload = this.#verifyRefreshTokenOrThrow(refreshToken);

            const currentSession = await this.#tokenStore.getSessionByRefreshJti({
              userId: payload.userId,
              refreshJti: payload.jti,
            });
            if (!currentSession) throw new ErrorUnauthorized();

            if (currentSession.userAgent !== userAgent) {
              throw new ErrorUnauthorized();
            }

            const tokens = this.#tokenGenerator.generateTokens({
              userId: payload.userId,
              userAgent,
            });
            const newRefreshPayload = this.#verifyRefreshTokenOrThrow(tokens.refresh);

            await this.#tokenStore.deleteSessionByRefreshJti({
              userId: payload.userId,
              refreshJti: payload.jti,
            });
            await this.#tokenStore.createSession({
              userId: newRefreshPayload.userId,
              sessionId: newRefreshPayload.sid,
              userAgent,
              expiresAt: (newRefreshPayload.exp ?? Math.floor(Date.now() / 1000)) * 1000,
              refreshJti: newRefreshPayload.jti,
            });

            await this.#tryBlacklistAccessToken(request);
            this.#setAccessTokenToHeaders(reply, tokens.access);
            this.#setRefreshTokenToCookie(reply, tokens.refresh);

            reply.status(200).send();
          },
        );
      },
      { prefix: PREFIX },
    );
  }

  #extractUserAgentOrThrow(request: FastifyRequest) {
    const userAgent = request.headers['user-agent'];
    if (typeof userAgent !== 'string') {
      request.log.warn('User agent not found');
      throw new ErrorInvalidUserAgent();
    }

    return userAgent;
  }

  #getRefreshToken(request: FastifyRequest): string | null {
    return request.cookies?.[CONFIG.jwt.refresh.cookieName] || null;
  }

  #setAccessTokenToHeaders(reply: FastifyReply, accessToken: string) {
    return reply.header(HEADER_NAME.authorization, accessToken);
  }

  #setRefreshTokenToCookie(reply: FastifyReply, refreshToken: string) {
    return reply.setCookie(CONFIG.jwt.refresh.cookieName, refreshToken, REFRESH_TOKEN_COOKIE_CONFIG);
  }

  #removeRefreshTokenFromCookie(reply: FastifyReply) {
    return reply.setCookie(CONFIG.jwt.refresh.cookieName, '', { ...REFRESH_TOKEN_COOKIE_CONFIG, maxAge: 0 });
  }

  #verifyRefreshTokenOrThrow(token: string): { userId: UserId; sid: string; jti: string; exp?: number } {
    let payload;
    try {
      payload = this.#fastify.jwt.verify<{
        userId?: UserId;
        id?: UserId;
        sid?: string;
        jti?: string;
        typ?: 'access' | 'refresh';
        userAgent?: string;
        exp?: number;
      }>(token);
    } catch {
      throw new ErrorUnauthorized();
    }

    const userId = payload.userId ?? payload.id;
    if (!userId || payload.typ !== 'refresh' || !payload.sid || !payload.jti) {
      throw new ErrorUnauthorized();
    }

    return { userId, sid: payload.sid, jti: payload.jti, exp: payload.exp };
  }

  async #tryBlacklistAccessToken(request: FastifyRequest): Promise<void> {
    const token = extractAuthToken(request);
    if (!token) return;

    let payload;
    try {
      payload = this.#fastify.jwt.verify<{
        typ?: 'access' | 'refresh';
        jti?: string;
        exp?: number;
      }>(token);
    } catch {
      return;
    }

    if (payload.typ !== 'access' || !payload.jti || !payload.exp) {
      return;
    }

    await this.#tokenStore.blacklistAccessJti({
      accessJti: payload.jti,
      expiresAt: payload.exp * 1000,
    });
  }
}
