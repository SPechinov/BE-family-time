import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { SCHEMA_REGISTRATION_END, SCHEMA_REGISTRATION_START } from './schemas';
import { IAuthUseCases } from '@/domain/useCases';
import { UserContactsPlainEntity, UserPersonalInfoEntity, UserPlainCreateEntity } from '@/domain/entities';

const ROUTES = Object.freeze({
  REGISTRATION_START: '/registration-start',
  REGISTRATION_END: '/registration-end',
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
      ROUTES.REGISTRATION_START,
      {
        schema: SCHEMA_REGISTRATION_START,
      },
      async (request, reply) => {
        request.log.info(request.body);
        await this.#authUseCases.registrationBegin({
          logger: request.log,
          userContactsPlainEntity: new UserContactsPlainEntity({ email: request.body.email }),
        });
        reply.status(200).send();
      },
    );

    router.post(ROUTES.REGISTRATION_END, { schema: SCHEMA_REGISTRATION_END }, async (request, reply) => {
      await this.#authUseCases.registrationEnd({
        logger: request.log,
        code: request.body.code,
        userPlainCreateEntity: new UserPlainCreateEntity({
          contacts: new UserContactsPlainEntity({ email: request.body.email }),
          personalInfo: new UserPersonalInfoEntity({ firstName: request.body.firstName }),
          passwordPlain: request.body.password,
        }),
      });

      reply.status(200).send();
    });
  }
}
