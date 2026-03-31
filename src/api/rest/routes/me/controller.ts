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
              timeZone: user.timeZone,
              language: user.language,
              email: user.contacts?.email ?? '',
              phone: user.contacts?.phone ?? '',
              firstName: user.personalInfo?.firstName ?? '',
              lastName: user.personalInfo?.lastName ?? '',
              dateOfBirth: user.personalInfo?.dateOfBirth?.toISOString() ?? '',
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
                timeZone: request.body.timeZone,
                language: request.body.language,
              }),
            });

            reply.status(200).send({
              id: user.id,
              timeZone: user.timeZone,
              language: user.language,
              email: user.contacts?.email ?? '',
              phone: user.contacts?.phone ?? '',
              firstName: user.personalInfo?.firstName ?? '',
              lastName: user.personalInfo?.lastName ?? '',
              dateOfBirth: user.personalInfo?.dateOfBirth?.toISOString() ?? '',
            });
          },
        );
      },
      { prefix: PREFIX },
    );
  }
}
