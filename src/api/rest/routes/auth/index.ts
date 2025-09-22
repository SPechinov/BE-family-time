import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  SCHEMA_FORGOT_PASSWORD_END,
  SCHEMA_FORGOT_PASSWORD_START,
  SCHEMA_REFRESH_TOKEN,
  SCHEMA_REGISTRATION_END,
  SCHEMA_REGISTRATION_START,
  SHEMA_LOGIN,
  SHEMA_LOGOUT
} from './schemas';
import { IAuthUseCases } from '@/domain/useCases';
import {
  UserContactsPlainEntity,
  UserPersonalInfoEntity,
  UserPlainCreateEntity,
  UserPlainPatchEntity
} from '@/domain/entities';
import { IJwtService } from '@/domain/services';
import { AuthMiddleware } from '@/api/rest/middlewares';
import { CONFIG } from '@/config';
import { ErrorUnauthorized } from '@/pkg';
import { CookieSerializeOptions } from '@fastify/cookie';

const REFRESH_TOKEN_COOKIE_CONFIG: CookieSerializeOptions = {
  httpOnly: true,
  secure: CONFIG.env !== 'local',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/'
};

const ROUTES = Object.freeze({
  login: '/login',
  logout: '/logout',
  logoutAll: '/logout-all',
  refreshTokens: '/refresh-tokens',
  registrationStart: '/registration-start',
  registrationEnd: '/registration-end',
  forgotPasswordStart: '/forgot-password-start',
  forgotPasswordEnd: '/forgot-password-end'
});

export class AuthRoutesController {
  #fastify: FastifyInstance;
  #authUseCases: IAuthUseCases;
  #authMiddleware: AuthMiddleware;

  constructor(props: { fastify: FastifyInstance; authUseCases: IAuthUseCases; jwtService: IJwtService }) {
    this.#fastify = props.fastify;
    this.#authUseCases = props.authUseCases;
    this.#authMiddleware = new AuthMiddleware({ jwtService: props.jwtService });
    this.#register();
  }

  #register() {
    const router = this.#fastify.withTypeProvider<ZodTypeProvider>();

    router.post(
      ROUTES.login,
      {
        schema: SHEMA_LOGIN
      },
      async (request, reply) => {
        const { accessToken, refreshToken } = await this.#authUseCases.login({
          logger: request.log,
          userContactsPlainEntity: new UserContactsPlainEntity({ email: request.body.email }),
          passwordPlain: request.body.password
        });
        this.#setAccessToken(reply, accessToken);
        this.#setRefreshToken(reply, refreshToken);
        reply.status(200).send();
      }
    );

    router.post(
      ROUTES.logout,
      {
        preHandler: [this.#authMiddleware.authenticate],
        schema: SHEMA_LOGOUT
      },
      async (request, reply) => {
        const refreshToken = this.#getRefreshTokenOrThrow(request);

        await this.#authUseCases.logout({ refreshToken, logger: request.log });

        this.#removeRefreshToken(reply);
        reply.status(200).send();
      }
    );

    router.post(
      ROUTES.logoutAll,
      {
        preHandler: [this.#authMiddleware.authenticate],
        schema: SHEMA_LOGOUT
      },
      async (request, reply) => {
        const refreshToken = this.#getRefreshTokenOrThrow(request);

        await this.#authUseCases.logoutAll({
          logger: request.log,
          refreshToken,
          userId: request.userId
        });
        this.#removeRefreshToken(reply);
        reply.status(200).send();
      }
    );

    router.post(
      ROUTES.refreshTokens,
      {
        preHandler: [this.#authMiddleware.authenticate],
        schema: SCHEMA_REFRESH_TOKEN
      },
      async (request, reply) => {
        const oldRefreshToken = this.#getRefreshTokenOrThrow(request);
        const { accessToken, refreshToken } = await this.#authUseCases.refreshToken({
          logger: request.log,
          refreshToken: oldRefreshToken
        });

        this.#setAccessToken(reply, accessToken);
        this.#setRefreshToken(reply, refreshToken);
        reply.status(200).send();
      }
    );

    router.post(
      ROUTES.registrationStart,
      {
        schema: SCHEMA_REGISTRATION_START
      },
      async (request, reply) => {
        await this.#authUseCases.registrationStart({
          logger: request.log,
          userContactsPlainEntity: new UserContactsPlainEntity({ email: request.body.email })
        });
        reply.status(200).send();
      }
    );

    router.post(ROUTES.registrationEnd, { schema: SCHEMA_REGISTRATION_END }, async (request, reply) => {
      await this.#authUseCases.registrationEnd({
        logger: request.log,
        code: request.body.code,
        userPlainCreateEntity: new UserPlainCreateEntity({
          contacts: new UserContactsPlainEntity({ email: request.body.email }),
          personalInfo: new UserPersonalInfoEntity({ firstName: request.body.firstName }),
          passwordPlain: request.body.password
        })
      });
      reply.status(201).send();
    });

    router.post(ROUTES.forgotPasswordStart, { schema: SCHEMA_FORGOT_PASSWORD_START }, async (request, reply) => {
      await this.#authUseCases.forgotPasswordStart({
        logger: request.log,
        userContactsPlainEntity: new UserContactsPlainEntity({ email: request.body.email })
      });
      reply.status(200).send();
    });

    router.post(ROUTES.forgotPasswordEnd, { schema: SCHEMA_FORGOT_PASSWORD_END }, async (request, reply) => {
      await this.#authUseCases.forgotPasswordEnd({
        logger: request.log,
        code: request.body.code,
        userContactsPlainEntity: new UserContactsPlainEntity({ email: request.body.email }),
        userPlainPatchEntity: new UserPlainPatchEntity({
          passwordPlain: request.body.password
        })
      });
      reply.status(200).send();
    });
  }

  #getRefreshTokenOrThrow(request: FastifyRequest) {
    const refreshToken = request.cookies['refreshToken'];
    if (!refreshToken) throw new ErrorUnauthorized();

    return refreshToken;
  }

  #setAccessToken(reply: FastifyReply, token: string) {
    reply.header('Authorization', `${token}`);
  }

  #setRefreshToken(reply: FastifyReply, token: string) {
    reply.setCookie('refreshToken', token, REFRESH_TOKEN_COOKIE_CONFIG);
  }

  #removeRefreshToken(reply: FastifyReply) {
    reply.setCookie('refreshToken', '', { ...REFRESH_TOKEN_COOKIE_CONFIG, maxAge: 0 });
  }
}
