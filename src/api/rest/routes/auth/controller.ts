import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AUTH_SCHEMAS } from './schemas';
import {
  UserContactsPlainEntity,
  UserCreatePlainEntity,
  UserPasswordPlainEntity,
  UserPersonalInfoPlainEntity,
  SessionId,
  toSessionId,
  UserId,
} from '@/entities';
import { CONFIG, isDev } from '@/config';
import { ACCESS_TOKEN_COOKIE_CONFIG, HEADER_NAME, REFRESH_TOKEN_COOKIE_CONFIG } from '../../constants';
import { ErrorInvalidUserAgent, ErrorUnauthorized, ErrorUserNotExists } from '@/pkg';
import { PREFIX, ROUTES } from './constants';
import { ITokensSessionsGenerator } from '@/domains/services';
import { ITokensSessionsBlacklistStore, ITokensSessionsStore } from '@/domains/repositories/stores';
import {
  IForgotPasswordEndUseCase,
  IForgotPasswordStartUseCase,
  IGetSessionsUseCase,
  ILoginUseCase,
  ILogoutAllSessionsUseCase,
  ILogoutSessionByIdUseCase,
  ILogoutSessionUseCase,
  IRegistrationEndUseCase,
  IRegistrationStartUseCase,
  IRefreshTokensUseCase,
} from '@/domains/useCases';

export class AuthRoutesController {
  #fastify: FastifyInstance;
  #loginUseCase: ILoginUseCase;
  #registrationStartUseCase: IRegistrationStartUseCase;
  #registrationEndUseCase: IRegistrationEndUseCase;
  #forgotPasswordStartUseCase: IForgotPasswordStartUseCase;
  #forgotPasswordEndUseCase: IForgotPasswordEndUseCase;
  #refreshTokensUseCase: IRefreshTokensUseCase;
  #getSessionsUseCase: IGetSessionsUseCase;
  #logoutSessionUseCase: ILogoutSessionUseCase;
  #logoutAllSessionsUseCase: ILogoutAllSessionsUseCase;
  #logoutSessionByIdUseCase: ILogoutSessionByIdUseCase;
  #tokensSessionsGenerator: ITokensSessionsGenerator;
  #tokensSessionsStore: ITokensSessionsStore;
  #tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;

  constructor(props: {
    fastify: FastifyInstance;
    loginUseCase: ILoginUseCase;
    registrationStartUseCase: IRegistrationStartUseCase;
    registrationEndUseCase: IRegistrationEndUseCase;
    forgotPasswordStartUseCase: IForgotPasswordStartUseCase;
    forgotPasswordEndUseCase: IForgotPasswordEndUseCase;
    refreshTokensUseCase: IRefreshTokensUseCase;
    getSessionsUseCase: IGetSessionsUseCase;
    logoutSessionUseCase: ILogoutSessionUseCase;
    logoutAllSessionsUseCase: ILogoutAllSessionsUseCase;
    logoutSessionByIdUseCase: ILogoutSessionByIdUseCase;
    tokensSessionsGenerator: ITokensSessionsGenerator;
    tokensSessionsStore: ITokensSessionsStore;
    tokensSessionsBlacklistStore: ITokensSessionsBlacklistStore;
  }) {
    this.#fastify = props.fastify;
    this.#loginUseCase = props.loginUseCase;
    this.#registrationStartUseCase = props.registrationStartUseCase;
    this.#registrationEndUseCase = props.registrationEndUseCase;
    this.#forgotPasswordStartUseCase = props.forgotPasswordStartUseCase;
    this.#forgotPasswordEndUseCase = props.forgotPasswordEndUseCase;
    this.#refreshTokensUseCase = props.refreshTokensUseCase;
    this.#getSessionsUseCase = props.getSessionsUseCase;
    this.#logoutSessionUseCase = props.logoutSessionUseCase;
    this.#logoutAllSessionsUseCase = props.logoutAllSessionsUseCase;
    this.#logoutSessionByIdUseCase = props.logoutSessionByIdUseCase;
    this.#tokensSessionsGenerator = props.tokensSessionsGenerator;
    this.#tokensSessionsStore = props.tokensSessionsStore;
    this.#tokensSessionsBlacklistStore = props.tokensSessionsBlacklistStore;
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
            const tokens = await this.#loginUseCase.execute({
              logger: request.log,
              userContactsPlainEntity: new UserContactsPlainEntity({
                email: request.body.email,
              }),
              userPasswordPlainEntity: new UserPasswordPlainEntity(request.body.password),
              userAgent,
            });

            this.#setAccessTokenToCookie(reply, tokens.accessToken);
            this.#setRefreshTokenToCookie(reply, tokens.refreshToken);

            reply.status(200).send();
          },
        );

        router.post(
          ROUTES.registrationStart,
          {
            schema: AUTH_SCHEMAS.registrationStart,
          },
          async (request, reply) => {
            const result = await this.#registrationStartUseCase.execute({
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
            await this.#registrationEndUseCase.execute({
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
              const { otpCode } = await this.#forgotPasswordStartUseCase.execute({
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
              await this.#forgotPasswordEndUseCase.execute({
                logger: request.log,
                userContactsPlainEntity: new UserContactsPlainEntity({ email: request.body.email }),
                otpCode: request.body.otpCode,
                password: new UserPasswordPlainEntity(request.body.password),
              });

              this.#removeAccessTokenFromCookie(reply);
              this.#removeRefreshTokenFromCookie(reply);
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
            const sessions = await this.#getSessionsUseCase.execute({
              logger: request.log,
              userId: payload.userId,
              refreshJti: payload.jti,
              currentSessionId: payload.sid,
            });

            reply.status(200).send({
              sessions: sessions.map(
                (session: { sessionId: SessionId; expiresAt: number; userAgent: string; isCurrent: boolean }) => ({
                  sessionId: session.sessionId,
                  expiresAt: session.expiresAt,
                  userAgent: session.userAgent,
                  isCurrent: session.isCurrent,
                }),
              ),
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
            await this.#logoutAllSessionsUseCase.execute({
              logger: request.log,
              userId: payload.userId,
              refreshJti: payload.jti,
            });
            await this.#tryBlacklistAccessToken(request);
            this.#removeAccessTokenFromCookie(reply);
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
            await this.#logoutSessionUseCase.execute({
              logger: request.log,
              userId: payload.userId,
              refreshJti: payload.jti,
            });
            await this.#tryBlacklistAccessToken(request);
            this.#removeAccessTokenFromCookie(reply);
            this.#removeRefreshTokenFromCookie(reply);

            reply.status(200).send();
          },
        );

        router.delete(
          ROUTES.logoutSessionById,
          {
            schema: AUTH_SCHEMAS.logoutSessionById,
          },
          async (request, reply) => {
            const refreshToken = this.#getRefreshToken(request);
            if (!refreshToken) throw new ErrorUnauthorized();
            const payload = this.#verifyRefreshTokenOrThrow(refreshToken);

            const { isCurrentSession } = await this.#logoutSessionByIdUseCase.execute({
              logger: request.log,
              userId: payload.userId,
              refreshJti: payload.jti,
              sessionId: toSessionId(request.params.sessionId),
              currentSessionId: payload.sid,
            });

            if (isCurrentSession) {
              await this.#tryBlacklistAccessToken(request);
              this.#removeAccessTokenFromCookie(reply);
              this.#removeRefreshTokenFromCookie(reply);
            }

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

            const tokens = this.#tokensSessionsGenerator.generateTokens({
              userId: payload.userId,
              userAgent,
            });
            const newRefreshPayload = this.#verifyRefreshTokenOrThrow(tokens.refresh);
            const newAccessPayload = this.#verifyAccessTokenOrThrow(tokens.access);

            await this.#refreshTokensUseCase.execute({
              logger: request.log,
              userId: payload.userId,
              refreshJti: payload.jti,
              userAgent,
              newSession: {
                userId: newRefreshPayload.userId,
                sessionId: newRefreshPayload.sid,
                refreshJti: newRefreshPayload.jti,
                refreshExpiresAt: (newRefreshPayload.exp ?? Math.floor(Date.now() / 1000)) * 1000,
                accessJti: newAccessPayload.jti,
                accessExpiresAt: newAccessPayload.exp * 1000,
              },
              currentAccessToken: (await this.#getCurrentAccessTokenPayload(request)) ?? undefined,
            });
            this.#setAccessTokenToCookie(reply, tokens.access);
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

  #getAccessToken(request: FastifyRequest): string | null {
    return request.cookies?.[CONFIG.jwt.access.cookieName] || null;
  }

  #setAccessTokenToCookie(reply: FastifyReply, accessToken: string) {
    return reply.setCookie(CONFIG.jwt.access.cookieName, accessToken, ACCESS_TOKEN_COOKIE_CONFIG);
  }

  #removeAccessTokenFromCookie(reply: FastifyReply) {
    return reply.setCookie(CONFIG.jwt.access.cookieName, '', { ...ACCESS_TOKEN_COOKIE_CONFIG, maxAge: 0 });
  }

  #setRefreshTokenToCookie(reply: FastifyReply, refreshToken: string) {
    return reply.setCookie(CONFIG.jwt.refresh.cookieName, refreshToken, REFRESH_TOKEN_COOKIE_CONFIG);
  }

  #removeRefreshTokenFromCookie(reply: FastifyReply) {
    return reply.setCookie(CONFIG.jwt.refresh.cookieName, '', { ...REFRESH_TOKEN_COOKIE_CONFIG, maxAge: 0 });
  }

  #verifyRefreshTokenOrThrow(token: string): { userId: UserId; sid: SessionId; jti: string; exp?: number } {
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

    if (!payload.userId || payload.typ !== 'refresh' || !payload.sid || !payload.jti) {
      throw new ErrorUnauthorized();
    }

    return { userId: payload.userId, sid: toSessionId(payload.sid), jti: payload.jti, exp: payload.exp };
  }

  #verifyAccessTokenOrThrow(token: string): { userId: UserId; sid: SessionId; jti: string; exp: number } {
    let payload;
    try {
      payload = this.#fastify.jwt.verify<{
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

  async #tryBlacklistAccessToken(request: FastifyRequest): Promise<void> {
    const payload = await this.#getCurrentAccessTokenPayload(request);
    if (!payload) return;

    await this.#tokensSessionsBlacklistStore.addAccessJtiToBlacklist({
      accessJti: payload.jti,
      expiresAt: payload.expiresAt,
    });
  }

  async #getCurrentAccessTokenPayload(request: FastifyRequest): Promise<{ jti: string; expiresAt: number } | null> {
    const token = this.#getAccessToken(request);
    if (!token) return null;

    let payload;
    try {
      payload = this.#fastify.jwt.verify<{
        typ?: 'access' | 'refresh';
        jti?: string;
        exp?: number;
      }>(token);
    } catch {
      return null;
    }

    if (payload.typ !== 'access' || !payload.jti || !payload.exp) {
      return null;
    }

    return {
      jti: payload.jti,
      expiresAt: payload.exp * 1000,
    };
  }

}
