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
import { ITokensSessionsPayloadVerifier } from '@/domains/services';
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
  #tokensSessionsPayloadVerifier: ITokensSessionsPayloadVerifier;

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
    tokensSessionsPayloadVerifier: ITokensSessionsPayloadVerifier;
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
    this.#tokensSessionsPayloadVerifier = props.tokensSessionsPayloadVerifier;
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
            const payload = this.#getVerifiedRefreshPayloadOrThrow(request);
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
            const payload = this.#getVerifiedRefreshPayloadOrThrow(request);
            await this.#logoutAllSessionsUseCase.execute({
              logger: request.log,
              userId: payload.userId,
              refreshJti: payload.jti,
              currentAccessToken: this.#getCurrentAccessTokenPayload(request) ?? undefined,
            });
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
            const payload = this.#getVerifiedRefreshPayloadOrThrow(request);
            await this.#logoutSessionUseCase.execute({
              logger: request.log,
              userId: payload.userId,
              refreshJti: payload.jti,
              currentAccessToken: this.#getCurrentAccessTokenPayload(request) ?? undefined,
            });
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
            const payload = this.#getVerifiedRefreshPayloadOrThrow(request);

            const { isCurrentSession } = await this.#logoutSessionByIdUseCase.execute({
              logger: request.log,
              userId: payload.userId,
              refreshJti: payload.jti,
              sessionId: toSessionId(request.params.sessionId),
              currentSessionId: payload.sid,
              currentAccessToken: this.#getCurrentAccessTokenPayload(request) ?? undefined,
            });

            if (isCurrentSession) {
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
            const tokens = await this.#refreshTokensUseCase.execute({
              logger: request.log,
              refreshToken,
              userAgent,
              currentAccessToken: this.#getAccessToken(request) ?? undefined,
            });
            this.#setAccessTokenToCookie(reply, tokens.accessToken);
            this.#setRefreshTokenToCookie(reply, tokens.refreshToken);

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

  #getVerifiedRefreshPayloadOrThrow(request: FastifyRequest): {
    userId: UserId;
    sid: SessionId;
    jti: string;
    exp?: number;
  } {
    const refreshToken = this.#getRefreshToken(request);
    if (!refreshToken) throw new ErrorUnauthorized();

    return this.#tokensSessionsPayloadVerifier.verifyRefreshTokenOrThrow(refreshToken);
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

  #getCurrentAccessTokenPayload(request: FastifyRequest): { jti: string; expiresAt: number } | null {
    const token = this.#getAccessToken(request);
    if (!token) return null;

    const payload = this.#tokensSessionsPayloadVerifier.verifyAccessToken(token);
    if (!payload) return null;

    return {
      jti: payload.jti,
      expiresAt: payload.exp * 1000,
    };
  }
}
