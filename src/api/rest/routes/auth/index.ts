import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AUTH_SCHEMAS } from './schemas';
import { IAuthUseCases } from '@/domains/useCases';
import { UserContactsPlainEntity, UserCreatePlainEntity } from '@/entities';

const PREFIX = '/auth';

const ROUTES = Object.freeze({
  registrationStart: '/registration-start',
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
        this.setRoutes(router);
      },
      { prefix: PREFIX },
    );
  }

  private setRoutes(router: FastifyInstance) {
    router.post(
      ROUTES.registrationStart,
      {
        schema: AUTH_SCHEMAS.registrationStart,
      },
      async (request, reply) => {
        await this.#useCases.registrationStart({
          logger: request.log,
          userCreatePlainEntity: new UserCreatePlainEntity({
            contactsPlain: new UserContactsPlainEntity({ email: '' }),
          }),
        });
        reply.status(201).send();
      },
    );
  }
}
