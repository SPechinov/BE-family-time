import { ICreateUserGroupUseCase } from '@/domains/useCases';
import { GroupEntity, GroupsUsersCreateEntity } from '@/entities';
import { GroupsGuards } from './shared/guards';
import { GroupsUseCasesDeps } from './shared/types';
import { buildOptions, lockUserGroupsScope } from './shared/transaction';

export class CreateUserGroupUseCase implements ICreateUserGroupUseCase {
  readonly #deps: GroupsUseCasesDeps;
  readonly #guards: GroupsGuards;

  constructor(props: GroupsUseCasesDeps) {
    this.#deps = props;
    this.#guards = new GroupsGuards({ groupsUsersService: props.groupsUsersService });
  }

  async createUserGroup(props: Parameters<ICreateUserGroupUseCase['createUserGroup']>[0]): Promise<GroupEntity> {
    await this.#deps.usersService.findOneByUserIdOrThrow(props.userId, { logger: props.logger });

    return this.#deps.transactionService.executeInTransaction(async (client) => {
      await lockUserGroupsScope(props.userId, client);
      await this.#guards.checkLimitExceededUserGroupsOrThrow(props.userId, buildOptions(props.logger, client));

      const group = await this.#deps.groupsService.createOne(props.groupCreateEntity, buildOptions(props.logger, client));

      await this.#deps.groupsUsersService.createOne(
        new GroupsUsersCreateEntity({
          userId: props.userId,
          groupId: group.id,
          isOwner: true,
        }),
        buildOptions(props.logger, client),
      );

      props.logger.debug({ groupId: group.id }, 'Group created');
      return group;
    });
  }
}
