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
import { HEADER } from '../../constants';
import { ErrorUserNotExists } from '@/pkg';

const PREFIX = '/auth';

const ROUTES = Object.freeze({
  registrationStart: '/registration-start',
  registrationEnd: '/registration-end',
  forgotPasswordStart: '/forgot-password-start',
  forgotPasswordEnd: '/forgot-password-end',
});

export class AuthRoutesController {
  #fastify: FastifyInstance;
  #useCases: IAuthUseCases;

  constructor(props: { fastify: FastifyInstance; useCases: IAuthUseCases }) {
    this.#fastify = props.fastify;
    this.#useCases = props.useCases;
  }

  register() {
    this.#fastify.register(
      (instance: FastifyInstance) => {
        const router = instance.withTypeProvider<ZodTypeProvider>();

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
              reply.header(HEADER.headerDevOtpCode, result.otpCode);
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
                reply.header(HEADER.headerDevOtpCode, otpCode);
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
      },
      { prefix: PREFIX },
    );
  }
}
