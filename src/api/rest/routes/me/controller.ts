import { FastifyInstance } from 'fastify';
import { IAuthMiddleware } from '@/api/rest/domains';
import { IMeUseCases } from '@/domains/useCases';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PREFIX, ROUTES } from './constants';
import { SCHEMAS } from './schemas';

export class MeRoutesController {
  #fastify: FastifyInstance;
  #authMiddleware: IAuthMiddleware;
  #meUseCases: IMeUseCases;

  constructor(props: { fastify: FastifyInstance; authMiddleware: IAuthMiddleware; meUseCases: IMeUseCases }) {
    this.#fastify = props.fastify;
    this.#authMiddleware = props.authMiddleware;
    this.#meUseCases = props.meUseCases;
  }

  register() {
    this.#fastify.register(
      (instance) => {
        const router = instance.withTypeProvider<ZodTypeProvider>();

        router.get(
          ROUTES.getMe,
          {
            preHandler: [this.#authMiddleware.authenticate],
            schema: SCHEMAS.getMe,
          },
          async (request, reply) => {
            const user = await this.#meUseCases.getMe({ userId: request.userId });
            reply.status(200).send({
              id: user.id,
              email: user.contactsPlain?.email ?? null,
              phone: user.contactsPlain?.phone ?? null,
              firstName: user.personalInfoPlain?.firstName ?? null,
              lastName: user.personalInfoPlain?.lastName ?? null,
            });
          },
        );
      },
      { prefix: PREFIX },
    );
  }
}
