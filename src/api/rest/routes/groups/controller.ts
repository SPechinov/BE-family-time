import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PREFIX, ROUTES } from './constants';
import {
  ICreateUserGroupUseCase,
  IDeleteUserGroupUseCase,
  IExcludeUserFromGroupUseCase,
  IGetUserGroupUseCase,
  IInviteUserInGroupUseCase,
  IListUserGroupsUseCase,
  IPatchUserGroupUseCase,
} from '@/domains/useCases';
import { SCHEMAS } from './schemas';
import { toCreateGroupCommand, toGroupResponse, toGroupsResponse, toPatchGroupCommand } from '@/api/rest/mappers';

export class GroupsRoutesController {
  #fastify: FastifyInstance;
  #listUserGroupsUseCase: IListUserGroupsUseCase;
  #createUserGroupUseCase: ICreateUserGroupUseCase;
  #getUserGroupUseCase: IGetUserGroupUseCase;
  #patchUserGroupUseCase: IPatchUserGroupUseCase;
  #inviteUserInGroupUseCase: IInviteUserInGroupUseCase;
  #excludeUserFromGroupUseCase: IExcludeUserFromGroupUseCase;
  #deleteUserGroupUseCase: IDeleteUserGroupUseCase;

  constructor(props: {
    fastify: FastifyInstance;
    listUserGroupsUseCase: IListUserGroupsUseCase;
    createUserGroupUseCase: ICreateUserGroupUseCase;
    getUserGroupUseCase: IGetUserGroupUseCase;
    patchUserGroupUseCase: IPatchUserGroupUseCase;
    inviteUserInGroupUseCase: IInviteUserInGroupUseCase;
    excludeUserFromGroupUseCase: IExcludeUserFromGroupUseCase;
    deleteUserGroupUseCase: IDeleteUserGroupUseCase;
  }) {
    this.#fastify = props.fastify;
    this.#listUserGroupsUseCase = props.listUserGroupsUseCase;
    this.#createUserGroupUseCase = props.createUserGroupUseCase;
    this.#getUserGroupUseCase = props.getUserGroupUseCase;
    this.#patchUserGroupUseCase = props.patchUserGroupUseCase;
    this.#inviteUserInGroupUseCase = props.inviteUserInGroupUseCase;
    this.#excludeUserFromGroupUseCase = props.excludeUserFromGroupUseCase;
    this.#deleteUserGroupUseCase = props.deleteUserGroupUseCase;
  }

  register() {
    this.#fastify.register(
      (instance) => {
        const router = instance.withTypeProvider<ZodTypeProvider>();

        router.get(
          ROUTES.getList,
          {
            schema: SCHEMAS.getList,
            preHandler: [instance.authenticate],
          },
          async (request, reply) => {
            const groups = await this.#listUserGroupsUseCase.execute({
              userId: request.userId,
              logger: request.log,
            });
            reply.status(200).send(toGroupsResponse(groups));
          },
        );

        router.post(
          ROUTES.create,
          {
            schema: SCHEMAS.create,
            preHandler: [instance.authenticate],
          },
          async (request, reply) => {
            const group = await this.#createUserGroupUseCase.execute({
              groupCreateEntity: toCreateGroupCommand(request.body),
              userId: request.userId,
              logger: request.log,
            });
            reply.status(201).send(toGroupResponse(group));
          },
        );

        router.get(
          ROUTES.get,
          {
            schema: SCHEMAS.get,
            preHandler: [instance.authenticate],
          },
          async (request, reply) => {
            const group = await this.#getUserGroupUseCase.execute({
              userId: request.userId,
              groupId: request.params.groupId,
              logger: request.log,
            });

            reply.status(200).send(toGroupResponse(group));
          },
        );

        router.patch(
          ROUTES.patch,
          {
            schema: SCHEMAS.patch,
            preHandler: [instance.authenticate],
          },
          async (request, reply) => {
            const group = await this.#patchUserGroupUseCase.execute({
              userId: request.userId,
              groupId: request.params.groupId,
              groupPatchOneEntity: toPatchGroupCommand(request.body),
              logger: request.log,
            });
            reply.status(200).send(toGroupResponse(group));
          },
        );

        router.post(
          ROUTES.inviteUser,
          {
            schema: SCHEMAS.invite,
            preHandler: [instance.authenticate],
          },
          async (request, reply) => {
            await this.#inviteUserInGroupUseCase.execute({
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
            preHandler: [instance.authenticate],
          },
          async (request, reply) => {
            await this.#excludeUserFromGroupUseCase.execute({
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
            preHandler: [instance.authenticate],
          },
          async (request, reply) => {
            await this.#deleteUserGroupUseCase.execute({
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
