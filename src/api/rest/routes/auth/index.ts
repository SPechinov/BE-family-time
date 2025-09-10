import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { SCHEMA_REGISTRATION_START } from './schemas';
import { IAuthUseCases } from '../../../../domain/useCases';

export class AuthRoutesController {
  #fastify: FastifyInstance;
  #authUseCases: IAuthUseCases;

  constructor(props: { fastify: FastifyInstance; authUseCases: IAuthUseCases }) {
    this.#fastify = props.fastify;
    this.#authUseCases = props.authUseCases;
    this.#register();
  }

  #register() {
    this.#fastify.withTypeProvider<ZodTypeProvider>().post(
      '/registration-start',
      {
        schema: SCHEMA_REGISTRATION_START,
      },
      async (request, reply) => {
        console.log(request.body.email);
        return null;
      },
    );
  }
}
