import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AUTH_SCHEMAS } from './schemas';
import { IAuthUseCases } from '@/domains/useCases';
import {
  UserContactsPlainEntity,
  UserCreatePlainEntity,
  UserPasswordPlainEntity,
  UserPersonalInfoPlainEntity,
} from '@/entities';
import { CONFIG, isDev } from '@/config';
import { HEADER_NAME } from '../../constants';
import { ErrorUnauthorized, ErrorUserNotExists } from '@/pkg';
import { PREFIX, ROUTES } from './constants';
import { ITokenService } from '../../domains';

export class AuthRoutesController {
  #fastify: FastifyInstance;
  #useCases: IAuthUseCases;
  #tokenService: ITokenService;

  constructor(props: { fastify: FastifyInstance; useCases: IAuthUseCases; tokenService: ITokenService }) {
    this.#fastify = props.fastify;
    this.#useCases = props.useCases;
    this.#tokenService = props.tokenService;
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
              throw new Error('Invalid user agent');
            }

            const { user } = await this.#useCases.login({
              logger: request.log,
              userContactsPlainEntity: new UserContactsPlainEntity({
                email: request.body.email,
              }),
              userPasswordPlainEntity: new UserPasswordPlainEntity(request.body.password),
              jwtPayload: { userAgent },
            });

            const tokens = this.#tokenService.generateTokens({
              request,
              userId: user.id,
            });
            this.#tokenService.setTokens(reply, tokens);

            // Store session in Redis
            const expiresAt = Date.now() + CONFIG.jwt.refresh.expiry;
            await this.#tokenService.storeSession({
              userId: user.id,
              refreshToken: tokens.refresh,
              userAgent,
              expiresAt,
            });

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
            schema: AUTH_SCHEMAS.getAllSession,
          },
          async (request, reply) => {
            const refreshToken = this.#tokenService.getRefreshToken(request);
            if (!refreshToken) {
              throw new ErrorUnauthorized();
            }

            const payload = this.#tokenService.verifyRefreshToken(refreshToken);

            const sessions = await this.#tokenService.getAllSessions({
              userId: payload.id,
              currentRefreshToken: refreshToken,
            });

            reply.status(200).send({
              sessions: sessions.map((session) => ({
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
            const refreshToken = this.#tokenService.getRefreshToken(request);
            if (!refreshToken) {
              throw new ErrorUnauthorized();
            }

            const payload = this.#tokenService.verifyRefreshToken(refreshToken);

            await this.#tokenService.deleteAllSessions({ userId: payload.id });
            this.#tokenService.removeRefreshTokenFromCookie(reply);

            reply.status(200).send();
          },
        );

        router.post(
          ROUTES.logoutSession,
          {
            schema: AUTH_SCHEMAS.logoutSession,
          },
          async (request, reply) => {
            const refreshToken = this.#tokenService.getRefreshToken(request);
            if (!refreshToken) {
              throw new ErrorUnauthorized();
            }

            const payload = this.#tokenService.verifyRefreshToken(refreshToken);

            await this.#tokenService.deleteSession({ userId: payload.id, refreshToken });
            this.#tokenService.removeRefreshTokenFromCookie(reply);

            reply.status(200).send();
          },
        );

        router.post(
          ROUTES.refreshTokens,
          {
            schema: AUTH_SCHEMAS.refreshTokens,
          },
          async (request, reply) => {
            const refreshToken = this.#tokenService.getRefreshToken(request);
            if (!refreshToken) {
              throw new Error('Unauthorized');
            }

            const payload = this.#tokenService.verifyRefreshToken(refreshToken);

            // Verify session exists in Redis
            const session = await this.#tokenService.getSession({
              userId: payload.id,
              refreshToken,
            });

            if (!session) {
              request.log.warn({ userId: payload.id }, 'Session not found in Redis');
              throw new Error('Unauthorized');
            }

            const tokens = this.#tokenService.generateTokens({
              request,
              userId: payload.id,
            });
            this.#tokenService.setTokens(reply, tokens);

            // Update session with new refresh token
            const expiresAt = Date.now() + CONFIG.jwt.refresh.expiry;
            await this.#tokenService.storeSession({
              userId: payload.id,
              refreshToken: tokens.refresh,
              userAgent: request.headers['user-agent'] || session.userAgent,
              expiresAt,
            });

            // Delete old session
            await this.#tokenService.deleteSession({ userId: payload.id, refreshToken });

            reply.status(200).send();
          },
        );
      },
      { prefix: PREFIX },
    );
  }
}
