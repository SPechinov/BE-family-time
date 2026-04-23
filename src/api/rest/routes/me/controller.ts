import { FastifyInstance } from 'fastify';
import { IGetMeUseCase, IPatchMeProfileUseCase } from '@/domains/useCases';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PREFIX, ROUTES } from './constants';
import { SCHEMAS } from './schemas';
import { toGetMeCommand, toMeResponse, toPatchMeProfileCommand } from '@/api/rest/mappers';

type ZodRouter = FastifyInstance<any, any, any, any, ZodTypeProvider>;

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

        this.#registerGetMe(router);
        this.#registerPatch(router);
      },
      { prefix: PREFIX },
    );
  }

  #registerGetMe(router: ZodRouter): void {
    router.get(
      ROUTES.getMe,
      {
        preHandler: [router.authenticate],
        schema: SCHEMAS.getMe,
      },
      async (request, reply) => {
        const user = await this.#getMeUseCase.execute({
          logger: request.log,
          ...toGetMeCommand({ userId: request.userId }),
        });
        reply.status(200).send(toMeResponse(user));
      },
    );
  }

  #registerPatch(router: ZodRouter): void {
    router.patch(
      ROUTES.patch,
      {
        preHandler: [router.authenticate],
        schema: SCHEMAS.patch,
      },
      async (request, reply) => {
        const user = await this.#patchMeProfileUseCase.execute({
          logger: request.log,
          ...toPatchMeProfileCommand({
            userId: request.userId,
            body: request.body,
          }),
        });

        reply.status(200).send(toMeResponse(user));
      },
    );
  }
}
