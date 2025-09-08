import { FastifyInstance } from 'fastify';
import { SCHEMA_REGISTRATION_BEGIN } from './schemas';
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
    this.#fastify.post('/registration-begin', { schema: SCHEMA_REGISTRATION_BEGIN }, async (request, reply) => {

      console.log(request.body);
      return null;
    });
  }
}
