import { IDeleteUserGroupUseCase } from '@/domains/useCases';
import { GroupFindOneEntity, GroupsUsersFindManyEntity } from '@/entities';
import { ErrorGroupHasUsers } from '@/pkg';
import { GroupsGuards } from './shared/guards';
import { GroupUseCasesDeps } from './shared/types';
import { buildOptions, lockGroupMembersScope } from './shared/transaction';

export class DeleteUserGroupUseCase implements IDeleteUserGroupUseCase {
  readonly #deps: GroupUseCasesDeps;
  readonly #guards: GroupsGuards;

  constructor(props: GroupUseCasesDeps) {
    this.#deps = props;
    this.#guards = new GroupsGuards({ groupsUsersService: props.groupsUsersService });
  }

  async execute(props: Parameters<IDeleteUserGroupUseCase['execute']>[0]): Promise<void> {
    await this.#deps.usersService.findOneByUserIdOrThrow(props.userId, { logger: props.logger });

    await this.#deps.transactionService.executeInTransaction(async (client) => {
      await lockGroupMembersScope(props.groupId, client);
      await this.#guards.checkIsGroupOwnerOrThrow(props.groupId, props.userId, buildOptions(props.logger, client));

      const groupUsersCount = await this.#deps.groupsUsersService.count(
        new GroupsUsersFindManyEntity({ groupId: props.groupId }),
        buildOptions(props.logger, client),
      );
      if (groupUsersCount > 1) throw new ErrorGroupHasUsers();

      await this.#deps.groupsService.deleteOne(new GroupFindOneEntity({ id: props.groupId }), buildOptions(props.logger, client));
    });
  }
}
