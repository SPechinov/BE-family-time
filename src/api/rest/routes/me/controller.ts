import { FastifyInstance } from 'fastify';
import { IGetMeUseCase, IPatchMeProfileUseCase } from '@/domains/useCases';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PREFIX, ROUTES } from './constants';
import { SCHEMAS } from './schemas';
import { toMeResponse, toPatchMeCommand } from '@/api/rest/mappers';

export class MeRoutesController {
  #fastify: FastifyInstance;
  #getMeUseCase: IGetMeUseCase;
  #patchMeProfileUseCase: IPatchMeProfileUseCase;

  constructor(props: {
    fastify: FastifyInstance;
    getMeUseCase: IGetMeUseCase;
    patchMeProfileUseCase: IPatchMeProfileUseCase;
  }) {
    this.#fastify = props.fastify;
    this.#getMeUseCase = props.getMeUseCase;
    this.#patchMeProfileUseCase = props.patchMeProfileUseCase;
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
            const user = await this.#getMeUseCase.execute({
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
            const user = await this.#patchMeProfileUseCase.execute({
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
