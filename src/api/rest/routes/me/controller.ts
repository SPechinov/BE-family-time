import { FastifyInstance } from 'fastify';
import { IMeUseCases } from '@/domains/useCases';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PREFIX, ROUTES } from './constants';
import { SCHEMAS } from './schemas';
import { toMeResponse, toPatchMeCommand } from '@/api/rest/mappers';

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
            preHandler: [instance.authenticate],
            schema: SCHEMAS.getMe,
          },
          async (request, reply) => {
            const user = await this.#meUseCases.getMe({
              logger: request.log,
              userId: request.userId,
            });
            reply.status(200).send(toMeResponse(user));
          },
        );

        router.patch(
          ROUTES.patch,
          {
            preHandler: [instance.authenticate],
            schema: SCHEMAS.patch,
          },
          async (request, reply) => {
            const user = await this.#meUseCases.patch({
              logger: request.log,
              userId: request.userId,
              userPatchOnePlainEntity: toPatchMeCommand(request.body),
            });

            reply.status(200).send(toMeResponse(user));
          },
        );
      },
      { prefix: PREFIX },
    );
  }
}
