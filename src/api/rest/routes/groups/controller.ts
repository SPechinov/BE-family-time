import { FastifyInstance } from 'fastify';
import { IAuthMiddleware } from '@/api/rest/domains';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PREFIX, ROUTES } from './constants';
import { IGroupsUseCases } from '@/domains/useCases';
import { SCHEMAS } from './schemas';
import { GroupCreateEntity, GroupPatchOneEntity } from '@/entities';
import { UUID } from 'node:crypto';

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

        router.get(
          ROUTES.getList,
          {
            schema: SCHEMAS.getList,
          },
          async (request, reply) => {
            const groups = await this.#groupsUseCases.findUserGroupsList({
              userId: request.userId,
              logger: request.log,
            });
            reply.status(200).send(
              groups.map((group) => ({
                id: group.id,
                name: group.name,
                description: group.description,
              })),
            );
          },
        );

        router.post(
          ROUTES.create,
          {
            schema: SCHEMAS.create,
          },
          async (request, reply) => {
            await this.#groupsUseCases.createUserGroup({
              groupCreateEntity: new GroupCreateEntity({
                name: request.body.name,
                description: request.body.description ?? undefined,
              }),
              userId: request.userId,
              logger: request.log,
            });
            reply.status(201).send();
          },
        );

        router.get(
          ROUTES.get,
          {
            schema: SCHEMAS.get,
          },
          async (request, reply) => {
            const group = await this.#groupsUseCases.findUserGroup({
              userId: request.userId,
              groupId: request.params.groupId,
              logger: request.log,
            });

            reply.status(200).send({
              id: group.id,
              name: group.name,
              description: group.description,
            });
          },
        );

        router.patch(
          ROUTES.patch,
          {
            schema: SCHEMAS.patch,
          },
          async (request, reply) => {
            const group = await this.#groupsUseCases.patchUserGroup({
              userId: request.userId,
              groupId: request.params.groupId,
              groupPatchOneEntity: new GroupPatchOneEntity({
                name: request.body.name,
                description: request.body.description,
              }),
              logger: request.log,
            });
            reply.status(200).send({
              id: group.id,
              name: group.name,
              description: group.description,
            });
          },
        );

        router.post(
          ROUTES.inviteUser,
          {
            schema: SCHEMAS.invite,
          },
          async (request, reply) => {
            await this.#groupsUseCases.inviteUserInGroup({
              groupId: request.params.groupId,
              actorUserId: request.userId,
              targetUserId: request.body.targetUserId,
              logger: request.log,
            });
            reply.status(200).send();
          },
        );

        router.post(
          ROUTES.excludeUser,
          {
            schema: SCHEMAS.exclude,
          },
          async (request, reply) => {
            await this.#groupsUseCases.excludeUserFromGroup({
              groupId: request.params.groupId,
              actorUserId: request.userId,
              targetUserId: request.body.targetUserId,
              logger: request.log,
            });
            reply.status(200).send();
          },
        );

        router.delete(
          ROUTES.delete,
          {
            schema: SCHEMAS.delete,
          },
          async (request, reply) => {
            await this.#groupsUseCases.deleteUserGroup({
              userId: request.userId,
              groupId: request.params.groupId,
              logger: request.log,
            });
            reply.status(200).send();
          },
        );
      },
      { prefix: PREFIX },
    );
  }
}
