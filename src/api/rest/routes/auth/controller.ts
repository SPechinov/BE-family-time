import { FastifyInstance, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AUTH_SCHEMAS } from './schemas';
import { SessionTokenMeta, SessionTokenPayload } from '@/entities';
import { isDev } from '@/config';
import { HEADER_NAME } from '../../constants';
import { ErrorUnauthorized } from '@/pkg';
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
import {
  toForgotPasswordEndCommand,
  toForgotPasswordStartCommand,
  toGetAllSessionsCommand,
  toGetAllSessionsResponse,
  toLoginCommand,
  toLogoutAllSessionsCommand,
  toLogoutSessionByIdCommand,
  toLogoutSessionCommand,
  toRefreshTokensCommand,
  toRegistrationEndCommand,
  toRegistrationStartCommand,
} from '@/api/rest/mappers';

type ZodRouter = FastifyInstance<any, any, any, any, ZodTypeProvider>;

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
        const router = instance.withTypeProvider<ZodTypeProvider>();

        this.#registerLogin(router);
        this.#registerRegistrationStart(router);
        this.#registerRegistrationEnd(router);
        this.#registerForgotPasswordStart(router);
        this.#registerForgotPasswordEnd(router);
        this.#registerGetAllSessions(router);
        this.#registerLogoutAllSessions(router);
        this.#registerLogoutSession(router);
        this.#registerLogoutSessionById(router);
        this.#registerRefreshTokens(router);
      },
      { prefix: PREFIX },
    );
  }

  #registerLogin(router: ZodRouter): void {
    router.post(
      ROUTES.login,
      {
        schema: AUTH_SCHEMAS.login,
      },
      async (request, reply) => {
        const tokens = await this.#loginUseCase.execute({
          logger: request.log,
          ...toLoginCommand({
            email: request.body.email,
            password: request.body.password,
            userAgent: request.userAgent,
          }),
        });

        this.#authCookiesService.setAccessToken(reply, tokens.accessToken);
        this.#authCookiesService.setRefreshToken(reply, tokens.refreshToken);

        reply.status(200).send();
      },
    );
  }

  #registerRegistrationStart(router: ZodRouter): void {
    router.post(
      ROUTES.registrationStart,
      {
        schema: AUTH_SCHEMAS.registrationStart,
      },
      async (request, reply) => {
        const result = await this.#registrationStartUseCase.execute({
          logger: request.log,
          ...toRegistrationStartCommand({ email: request.body.email }),
        });
        if (isDev()) {
          reply.header(HEADER_NAME.devHeaderOtpCode, result.otpCode);
        }
        reply.status(200).send();
      },
    );
  }

  #registerRegistrationEnd(router: ZodRouter): void {
    router.post(
      ROUTES.registrationEnd,
      {
        schema: AUTH_SCHEMAS.registrationEnd,
      },
      async (request, reply) => {
        await this.#registrationEndUseCase.execute({
          logger: request.log,
          ...toRegistrationEndCommand({
            email: request.body.email,
            otpCode: request.body.otpCode,
            firstName: request.body.firstName,
            password: request.body.password,
            timeZone: request.body.timeZone,
            language: request.body.language,
          }),
        });
        reply.status(201).send();
      },
    );
  }

  #registerForgotPasswordStart(router: ZodRouter): void {
    router.post(
      ROUTES.forgotPasswordStart,
      {
        schema: AUTH_SCHEMAS.forgotPasswordStart,
        config: {
          hideUserNotExistsAsOk: true,
        },
      },
      async (request, reply) => {
        const { otpCode } = await this.#forgotPasswordStartUseCase.execute({
          logger: request.log,
          ...toForgotPasswordStartCommand({ email: request.body.email }),
        });

        if (isDev()) {
          reply.header(HEADER_NAME.devHeaderOtpCode, otpCode);
        }
        reply.status(200).send();
      },
    );
  }

  #registerForgotPasswordEnd(router: ZodRouter): void {
    router.post(
      ROUTES.forgotPasswordEnd,
      {
        schema: AUTH_SCHEMAS.forgotPasswordEnd,
        config: {
          hideUserNotExistsAsOk: true,
        },
      },
      async (request, reply) => {
        await this.#forgotPasswordEndUseCase.execute({
          logger: request.log,
          ...toForgotPasswordEndCommand({
            email: request.body.email,
            otpCode: request.body.otpCode,
            password: request.body.password,
          }),
        });

        this.#authCookiesService.clearAccessToken(reply);
        this.#authCookiesService.clearRefreshToken(reply);
        reply.status(200).send();
      },
    );
  }

  #registerGetAllSessions(router: ZodRouter): void {
    router.get(
      ROUTES.getAllSessions,
      {
        schema: AUTH_SCHEMAS.getAllSession,
      },
      async (request, reply) => {
        const payload = this.#getVerifiedRefreshPayloadOrThrow(request);
        const sessions = await this.#getSessionsUseCase.execute({
          logger: request.log,
          ...toGetAllSessionsCommand(payload),
        });

        reply.status(200).send(toGetAllSessionsResponse(sessions));
      },
    );
  }

  #registerLogoutAllSessions(router: ZodRouter): void {
    router.post(
      ROUTES.logoutAllSessions,
      {
        schema: AUTH_SCHEMAS.logoutAllSession,
      },
      async (request, reply) => {
        const payload = this.#getVerifiedRefreshPayloadOrThrow(request);
        await this.#logoutAllSessionsUseCase.execute({
          logger: request.log,
          ...toLogoutAllSessionsCommand({
            payload,
            currentAccessToken: this.#getCurrentAccessTokenPayload(request) ?? undefined,
          }),
        });
        this.#authCookiesService.clearAccessToken(reply);
        this.#authCookiesService.clearRefreshToken(reply);

        reply.status(200).send();
      },
    );
  }

  #registerLogoutSession(router: ZodRouter): void {
    router.post(
      ROUTES.logoutSession,
      {
        schema: AUTH_SCHEMAS.logoutSession,
      },
      async (request, reply) => {
        const payload = this.#getVerifiedRefreshPayloadOrThrow(request);
        await this.#logoutSessionUseCase.execute({
          logger: request.log,
          ...toLogoutSessionCommand({
            payload,
            currentAccessToken: this.#getCurrentAccessTokenPayload(request) ?? undefined,
          }),
        });
        this.#authCookiesService.clearAccessToken(reply);
        this.#authCookiesService.clearRefreshToken(reply);

        reply.status(200).send();
      },
    );
  }

  #registerLogoutSessionById(router: ZodRouter): void {
    router.delete(
      ROUTES.logoutSessionById,
      {
        schema: AUTH_SCHEMAS.logoutSessionById,
      },
      async (request, reply) => {
        const payload = this.#getVerifiedRefreshPayloadOrThrow(request);

        const { isCurrentSession } = await this.#logoutSessionByIdUseCase.execute({
          logger: request.log,
          ...toLogoutSessionByIdCommand({
            payload,
            sessionId: request.params.sessionId,
            currentAccessToken: this.#getCurrentAccessTokenPayload(request) ?? undefined,
          }),
        });

        if (isCurrentSession) {
          this.#authCookiesService.clearAccessToken(reply);
          this.#authCookiesService.clearRefreshToken(reply);
        }

        reply.status(200).send();
      },
    );
  }

  #registerRefreshTokens(router: ZodRouter): void {
    router.post(
      ROUTES.refreshTokens,
      {
        schema: AUTH_SCHEMAS.refreshTokens,
      },
      async (request, reply) => {
        const { token: refreshToken } = this.#getVerifiedRefreshTokenOrThrow(request);

        const tokens = await this.#refreshTokensUseCase.execute({
          logger: request.log,
          ...toRefreshTokensCommand({
            refreshToken,
            userAgent: request.userAgent,
            currentAccessToken: this.#authCookiesService.getAccessToken(request) ?? undefined,
          }),
        });
        this.#authCookiesService.setAccessToken(reply, tokens.accessToken);
        this.#authCookiesService.setRefreshToken(reply, tokens.refreshToken);

        reply.status(200).send();
      },
    );
  }

  #getVerifiedRefreshPayloadOrThrow(request: FastifyRequest): SessionTokenPayload {
    return this.#getVerifiedRefreshTokenOrThrow(request).payload;
  }

  #getVerifiedRefreshTokenOrThrow(request: FastifyRequest): {
    token: string;
    payload: SessionTokenPayload;
  } {
    const token = this.#getRefreshTokenOrThrow(request);
    const payload = this.#tokensSessionsPayloadVerifier.verifyRefreshTokenOrThrow(token);
    return { token, payload };
  }

  #getRefreshTokenOrThrow(request: FastifyRequest): string {
    const refreshToken = this.#authCookiesService.getRefreshToken(request);
    if (!refreshToken) throw new ErrorUnauthorized();
    return refreshToken;
  }

  #getCurrentAccessTokenPayload(request: FastifyRequest): SessionTokenMeta | null {
    const token = this.#authCookiesService.getAccessToken(request);
    if (!token) return null;

    const payload = this.#tokensSessionsPayloadVerifier.verifyAccessToken(token);
    if (!payload) return null;

    return this.#tokensSessionsPayloadVerifier.toSessionAccessTokenMeta(payload);
  }
}
