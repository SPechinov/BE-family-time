import { FastifyInstance } from 'fastify';
import { IMeUseCases } from '@/domains/useCases';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PREFIX, ROUTES } from './constants';
import { SCHEMAS } from './schemas';

export class MeRoutesController {
  #fastify: FastifyInstance;
  #meUseCases: IMeUseCases;

  constructor(props: { fastify: FastifyInstance; meUseCases: IMeUseCases }) {
    this.#fastify = props.fastify;
    this.#meUseCases = props.meUseCases;
  }

  register() {
    this.#fastify.register(
      (instance) => {
        const router = instance.withTypeProvider<ZodTypeProvider>();

        router.get(
          ROUTES.getMe,
          {
            schema: SCHEMAS.getMe,
          },
          async (request, reply) => {
            const user = await this.#meUseCases.getMe({
              logger: request.log,
              userId: request.userId,
            });
            reply.status(200).send({
              id: user.id,
              email: user.contacts?.email ?? null,
              phone: user.contacts?.phone ?? null,
              firstName: user.personalInfo?.firstName ?? null,
              lastName: user.personalInfo?.lastName ?? null,
            });
          },
        );
      },
      { prefix: PREFIX },
    );
  }
}
