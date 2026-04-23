import { IInviteUserInGroupUseCase } from '@/domains/useCases';
import { GroupsUsersCreateEntity } from '@/entities';
import { GroupsGuards } from './shared/guards';
import { GroupUseCasesDeps } from './shared/types';
import { buildOptions, lockGroupMembersScope } from './shared/transaction';

export class InviteUserInGroupUseCase implements IInviteUserInGroupUseCase {
  readonly #deps: GroupUseCasesDeps;
  readonly #guards: GroupsGuards;

  constructor(props: GroupUseCasesDeps) {
    this.#deps = props;
    this.#guards = new GroupsGuards({ groupsUsersService: props.groupsUsersService });
  }

  async execute(props: Parameters<IInviteUserInGroupUseCase['execute']>[0]): Promise<void> {
    await Promise.all([
      this.#deps.usersService.findOneByUserIdOrThrow(props.actorUserId, { logger: props.logger }),
      this.#deps.usersService.findOneByUserIdOrThrow(props.targetUserId, { logger: props.logger }),
    ]);

    await this.#deps.transactionService.executeInTransaction(async (client) => {
      await lockGroupMembersScope(props.groupId, client);
      await this.#guards.checkIsGroupOwnerOrThrow(props.groupId, props.actorUserId, buildOptions(props.logger, client));
      await this.#guards.checkUserNotInGroupOrThrow(props.groupId, props.targetUserId, buildOptions(props.logger, client));
      await this.#guards.checkLimitExceededUsersInGroupOrThrow(props.groupId, buildOptions(props.logger, client));

      await this.#deps.groupsUsersService.createOne(
        new GroupsUsersCreateEntity({ userId: props.targetUserId, groupId: props.groupId, isOwner: false }),
        buildOptions(props.logger, client),
      );
    });
  }
}
