import { FastifyInstance } from 'fastify';
import { IAuthMiddleware } from '@/api/rest/domains';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PREFIX, ROUTES } from './constants';
import { IGroupsUseCases } from '@/domains/useCases';

export class GroupsRoutesController {
  #fastify: FastifyInstance;
  #authMiddleware: IAuthMiddleware;
  #groupsUseCases: IGroupsUseCases;

  constructor(props: { fastify: FastifyInstance; authMiddleware: IAuthMiddleware; groupsUseCases: IGroupsUseCases }) {
    this.#fastify = props.fastify;
    this.#authMiddleware = props.authMiddleware;
    this.#groupsUseCases = props.groupsUseCases;
  }

  register() {
    this.#fastify.register(
      (instance) => {
        const router = instance.withTypeProvider<ZodTypeProvider>();
        router.addHook('preHandler', this.#authMiddleware.authenticate);

        router.get(ROUTES.getList, {}, async (request, reply) => {
          reply.status(200).send();
        });

        router.post(ROUTES.create, {}, async (request, reply) => {
          reply.status(201).send();
        });

        router.get(ROUTES.get, {}, async (request, reply) => {
          reply.status(200).send();
        });

        router.patch(ROUTES.patch, {}, async (request, reply) => {
          reply.status(200).send();
        });

        router.delete(ROUTES.delete, {}, async (request, reply) => {
          reply.status(200).send();
        });

        router.post(ROUTES.inviteUser, {}, async (request, reply) => {
          reply.status(200).send();
        });

        router.post(ROUTES.excludeUser, {}, async (request, reply) => {
          reply.status(200).send();
        });
      },
      { prefix: PREFIX },
    );
  }
}
