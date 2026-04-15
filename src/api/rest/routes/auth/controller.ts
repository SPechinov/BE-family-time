import { FastifyInstance, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AUTH_SCHEMAS } from './schemas';
import {
  SessionAccessTokenMeta,
  SessionRefreshTokenPayload,
  UserContactsPlainEntity,
  UserCreatePlainEntity,
  UserPasswordPlainEntity,
  UserPersonalInfoPlainEntity,
  toSessionId,
} from '@/entities';
import { isDev } from '@/config';
import { HEADER_NAME } from '../../constants';
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
  IRefreshTokensUseCase,
  IRegistrationEndUseCase,
  IRegistrationStartUseCase,
} from '@/domains/useCases';
import { AuthCookiesService } from './authCookiesService';

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
  #authCookiesService: AuthCookiesService;

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
    this.#authCookiesService = new AuthCookiesService();
  }

  register() {
    this.#fastify.register(
      (instance: FastifyInstance) => {
        this.#registerLogin(instance);
        this.#registerRegistrationStart(instance);
        this.#registerRegistrationEnd(instance);
        this.#registerForgotPasswordStart(instance);
        this.#registerForgotPasswordEnd(instance);
        this.#registerGetAllSessions(instance);
        this.#registerLogoutAllSessions(instance);
        this.#registerLogoutSession(instance);
        this.#registerLogoutSessionById(instance);
        this.#registerRefreshTokens(instance);
      },
      { prefix: PREFIX },
    );
  }

  #registerLogin(router: FastifyInstance): void {
    router.withTypeProvider<ZodTypeProvider>().post(
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

        this.#authCookiesService.setAccessToken(reply, tokens.accessToken);
        this.#authCookiesService.setRefreshToken(reply, tokens.refreshToken);

        reply.status(200).send();
      },
    );
  }

  #registerRegistrationStart(router: FastifyInstance): void {
    router.withTypeProvider<ZodTypeProvider>().post(
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
  }

  #registerRegistrationEnd(router: FastifyInstance): void {
    router.withTypeProvider<ZodTypeProvider>().post(
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
  }

  #registerForgotPasswordStart(router: FastifyInstance): void {
    router.withTypeProvider<ZodTypeProvider>().post(
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
  }

  #registerForgotPasswordEnd(router: FastifyInstance): void {
    router.withTypeProvider<ZodTypeProvider>().post(
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

          this.#authCookiesService.clearAccessToken(reply);
          this.#authCookiesService.clearRefreshToken(reply);
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
  }

  #registerGetAllSessions(router: FastifyInstance): void {
    router.withTypeProvider<ZodTypeProvider>().get(
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
          sessions: sessions.map((session) => ({
            sessionId: session.sessionId,
            expiresAt: session.expiresAt,
            userAgent: session.userAgent,
            isCurrent: session.isCurrent,
          })),
        });
      },
    );
  }

  #registerLogoutAllSessions(router: FastifyInstance): void {
    router.withTypeProvider<ZodTypeProvider>().post(
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
        this.#authCookiesService.clearAccessToken(reply);
        this.#authCookiesService.clearRefreshToken(reply);

        reply.status(200).send();
      },
    );
  }

  #registerLogoutSession(router: FastifyInstance): void {
    router.withTypeProvider<ZodTypeProvider>().post(
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
        this.#authCookiesService.clearAccessToken(reply);
        this.#authCookiesService.clearRefreshToken(reply);

        reply.status(200).send();
      },
    );
  }

  #registerLogoutSessionById(router: FastifyInstance): void {
    router.withTypeProvider<ZodTypeProvider>().delete(
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
          this.#authCookiesService.clearAccessToken(reply);
          this.#authCookiesService.clearRefreshToken(reply);
        }

        reply.status(200).send();
      },
    );
  }

  #registerRefreshTokens(router: FastifyInstance): void {
    router.withTypeProvider<ZodTypeProvider>().post(
      ROUTES.refreshTokens,
      {
        schema: AUTH_SCHEMAS.refreshTokens,
      },
      async (request, reply) => {
        this.#getVerifiedRefreshPayloadOrThrow(request);
        const refreshToken = this.#getRefreshTokenOrThrow(request);

        const userAgent = this.#extractUserAgentOrThrow(request);
        const tokens = await this.#refreshTokensUseCase.execute({
          logger: request.log,
          refreshToken,
          userAgent,
          currentAccessToken: this.#authCookiesService.getAccessToken(request) ?? undefined,
        });
        this.#authCookiesService.setAccessToken(reply, tokens.accessToken);
        this.#authCookiesService.setRefreshToken(reply, tokens.refreshToken);

        reply.status(200).send();
      },
    );
  }

  #extractUserAgentOrThrow(request: FastifyRequest): string {
    const userAgent = request.headers['user-agent'];
    if (typeof userAgent !== 'string') {
      request.log.warn('User agent not found');
      throw new ErrorInvalidUserAgent();
    }

    return userAgent;
  }

  #getRefreshTokenOrThrow(request: FastifyRequest): string {
    const refreshToken = this.#authCookiesService.getRefreshToken(request);
    if (!refreshToken) throw new ErrorUnauthorized();
    return refreshToken;
  }

  #getVerifiedRefreshPayloadOrThrow(request: FastifyRequest): SessionRefreshTokenPayload {
    return this.#tokensSessionsPayloadVerifier.verifyRefreshTokenOrThrow(this.#getRefreshTokenOrThrow(request));
  }

  #getCurrentAccessTokenPayload(request: FastifyRequest): SessionAccessTokenMeta | null {
    const token = this.#authCookiesService.getAccessToken(request);
    if (!token) return null;

    const payload = this.#tokensSessionsPayloadVerifier.verifyAccessToken(token);
    if (!payload) return null;

    return this.#tokensSessionsPayloadVerifier.toSessionAccessTokenMeta(payload);
  }
}
