import { FastifyInstance } from 'fastify';
import { IMeUseCases } from '@/domains/useCases';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PREFIX, ROUTES } from './constants';
import { SCHEMAS } from './schemas';
import { UserPatchOnePlainEntity, UserPersonalInfoPlainEntity } from '@/entities';

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
            reply.status(200).send({
              id: user.id,
              email: user.contacts?.email ?? null,
              phone: user.contacts?.phone ?? null,
              firstName: user.personalInfo?.firstName ?? null,
              lastName: user.personalInfo?.lastName ?? null,
              dateOfBirth: user.personalInfo?.dateOfBirth?.toISOString() ?? null,
            });
          },
        );

        router.patch(
          ROUTES.patch,
          {
            preHandler: [instance.authenticate],
            schema: SCHEMAS.patch,
          },
          async (request, reply) => {
            let personalInfoPlain: UserPersonalInfoPlainEntity | undefined;
            if (
              request.body.firstName !== undefined ||
              request.body.lastName !== undefined ||
              request.body.dateOfBirth !== undefined
            ) {
              personalInfoPlain = new UserPersonalInfoPlainEntity({
                firstName: request.body.firstName,
                lastName: request.body.lastName,
                dateOfBirth: request.body.dateOfBirth,
              });
            }
            const user = await this.#meUseCases.patch({
              logger: request.log,
              userId: request.userId,
              userPatchOnePlainEntity: new UserPatchOnePlainEntity({
                personalInfoPlain,
              }),
            });

            reply.status(200).send({
              id: user.id,
              email: user.contacts?.email ?? null,
              phone: user.contacts?.phone ?? null,
              firstName: user.personalInfo?.firstName ?? null,
              lastName: user.personalInfo?.lastName ?? null,
              dateOfBirth: user.personalInfo?.dateOfBirth?.toISOString() ?? null,
            });
          },
        );
      },
      { prefix: PREFIX },
    );
  }
}
