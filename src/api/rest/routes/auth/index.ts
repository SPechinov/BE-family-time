import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AUTH_SCHEMAS } from './schemas';
import { IAuthUseCases } from '@/domains/useCases';
import { UserContactsPlainEntity, UserCreatePlainEntity, UserPersonalInfoPlainEntity } from '@/entities';

const PREFIX = '/auth';

const ROUTES = Object.freeze({
  registrationStart: '/registration-start',
  registrationEnd: '/registration-end',
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
            await this.#useCases.registrationStart({
              logger: request.log,
              userContactsPlainEntity: new UserContactsPlainEntity({ email: request.body.email }),
            });
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
              }),
            });
            reply.status(201).send();
          },
        );
      },
      { prefix: PREFIX },
    );
  }
}
