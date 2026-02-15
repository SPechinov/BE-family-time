import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AUTH_SCHEMAS } from './schemas';
import { IAuthUseCases } from '@/domains/useCases';
import {
  UserContactsPlainEntity,
  UserCreatePlainEntity,
  UserPasswordPlainEntity,
  UserPersonalInfoPlainEntity,
} from '@/entities';
import { isDev } from '@/config';
import { COOKIE_NAME, HEADER_NAME } from '../../constants';
import { ErrorInvalidUserAgent, ErrorUserNotExists } from '@/pkg';
import { IAuthMiddleware } from '@/api/rest/domains';
import { PREFIX, REFRESH_TOKEN_COOKIE_CONFIG, ROUTES } from './constants';

export class AuthRoutesController {
  #fastify: FastifyInstance;
  #useCases: IAuthUseCases;
  #authMiddleware: IAuthMiddleware;

  constructor(props: { fastify: FastifyInstance; useCases: IAuthUseCases; authMiddleware: IAuthMiddleware }) {
    this.#fastify = props.fastify;
    this.#useCases = props.useCases;
    this.#authMiddleware = props.authMiddleware;
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
            const userAgent = request.headers['user-agent'];
            if (typeof userAgent !== 'string') {
              request.log.warn('User agent not found');
              throw new ErrorInvalidUserAgent();
            }

            const tokens = await this.#useCases.login({
              logger: request.log,
              userContactsPlainEntity: new UserContactsPlainEntity({
                email: request.body.email,
              }),
              userPasswordPlainEntity: new UserPasswordPlainEntity(request.body.password),
              jwtPayload: { userAgent },
            });
            this.#setAccessToken(reply, tokens.accessToken);
            this.#setRefreshToken(reply, tokens.refreshToken);
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
            preHandler: [this.#authMiddleware.authenticate],
            schema: AUTH_SCHEMAS.getAllSession,
          },
          async (request, reply) => {
            const sessionsPayloads = await this.#useCases.getAllSessionsPayloads({ userId: request.userId });
            const currentJwt = this.#getRefreshToken(request);

            const sessions = sessionsPayloads.reduce<
              { expiresAt: number; userAgent: string | null; isCurrent: boolean }[]
            >((acc, session) => {
              if (
                typeof session.payload === 'object' &&
                session.payload !== null &&
                typeof session.payload.exp === 'number'
              ) {
                acc.push({
                  isCurrent: session.jwt === currentJwt,
                  expiresAt: session.payload.exp,
                  userAgent: typeof session.payload.userAgent === 'string' ? session.payload.userAgent : null,
                });
              }
              return acc;
            }, []);

            reply.status(200).send({ sessions });
          },
        );

        router.post(
          ROUTES.logoutAllSessions,
          {
            preHandler: [this.#authMiddleware.authenticate],
            schema: AUTH_SCHEMAS.logoutAllSession,
          },
          async (request, reply) => {
            await this.#useCases.logoutAllSessions({ userId: request.userId });
            this.#removeRefreshToken(reply);
            reply.status(200).send();
          },
        );

        router.post(
          ROUTES.logoutSession,
          {
            preHandler: [this.#authMiddleware.authenticate],
            schema: AUTH_SCHEMAS.logoutSession,
          },
          async (request, reply) => {
            const refreshToken = this.#getRefreshToken(request);
            if (!refreshToken) {
              reply.status(200).send();
              return;
            }

            await this.#useCases.logoutSession({ userId: request.userId, refreshToken });
            this.#removeRefreshToken(reply);
            reply.status(200).send();
          },
        );
      },
      { prefix: PREFIX },
    );
  }

  #setAccessToken(reply: FastifyReply, token: string) {
    reply.header(HEADER_NAME.authorization, token);
  }

  #setRefreshToken(reply: FastifyReply, token: string) {
    reply.setCookie(COOKIE_NAME.refreshToken, token, REFRESH_TOKEN_COOKIE_CONFIG);
  }

  #removeRefreshToken(reply: FastifyReply) {
    reply.setCookie(COOKIE_NAME.refreshToken, '', { ...REFRESH_TOKEN_COOKIE_CONFIG, maxAge: 0 });
  }

  #getRefreshToken(request: FastifyRequest): string | null {
    return request.cookies?.[COOKIE_NAME.refreshToken] || null;
  }
}
