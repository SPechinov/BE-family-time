import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  SCHEMA_FORGOT_PASSWORD_END,
  SCHEMA_FORGOT_PASSWORD_START,
  SCHEMA_REGISTRATION_END,
  SCHEMA_REGISTRATION_START,
  SHEMA_LOGIN,
} from './schemas';
import { IAuthUseCases } from '@/domain/useCases';
import {
  UserContactsPlainEntity,
  UserPersonalInfoEntity,
  UserPlainCreateEntity,
  UserPlainPatchEntity,
} from '@/domain/entities';

const ROUTES = Object.freeze({
  login: '/login',
  registrationStart: '/registration-start',
  registrationEnd: '/registration-end',
  forgotPasswordStart: '/forgot-password-start',
  forgotPasswordEnd: '/forgot-password-end',
});

export class AuthRoutesController {
  #fastify: FastifyInstance;
  #authUseCases: IAuthUseCases;

  constructor(props: { fastify: FastifyInstance; authUseCases: IAuthUseCases }) {
    this.#fastify = props.fastify;
    this.#authUseCases = props.authUseCases;
    this.#register();
  }

  #register() {
    const router = this.#fastify.withTypeProvider<ZodTypeProvider>();

    router.post(
      ROUTES.login,
      {
        schema: SHEMA_LOGIN,
      },
      async (request, reply) => {
        reply.status(200).send({ token: 'token' });
      },
    );

    router.post(
      ROUTES.registrationStart,
      {
        schema: SCHEMA_REGISTRATION_START,
      },
      async (request, reply) => {
        request.log.info(request.body);
        await this.#authUseCases.registrationStart({
          logger: request.log,
          userContactsPlainEntity: new UserContactsPlainEntity({ email: request.body.email }),
        });
        reply.status(200).send();
      },
    );

    router.post(ROUTES.registrationEnd, { schema: SCHEMA_REGISTRATION_END }, async (request, reply) => {
      await this.#authUseCases.registrationEnd({
        logger: request.log,
        code: request.body.code,
        userPlainCreateEntity: new UserPlainCreateEntity({
          contacts: new UserContactsPlainEntity({ email: request.body.email }),
          personalInfo: new UserPersonalInfoEntity({ firstName: request.body.firstName }),
          passwordPlain: request.body.password,
        }),
      });
      reply.status(201).send();
    });

    router.post(ROUTES.forgotPasswordStart, { schema: SCHEMA_FORGOT_PASSWORD_START }, async (request, reply) => {
      await this.#authUseCases.forgotPasswordStart({
        logger: request.log,
        userContactsPlainEntity: new UserContactsPlainEntity({ email: request.body.email }),
      });
      reply.status(200).send();
    });

    router.post(ROUTES.forgotPasswordEnd, { schema: SCHEMA_FORGOT_PASSWORD_END }, async (request, reply) => {
      await this.#authUseCases.forgotPasswordEnd({
        logger: request.log,
        code: request.body.code,
        userContactsPlainEntity: new UserContactsPlainEntity({ email: request.body.email }),
        userPlainPatchEntity: new UserPlainPatchEntity({
          passwordPlain: request.body.password,
        }),
      });
      reply.status(200).send();
    });
  }
}
