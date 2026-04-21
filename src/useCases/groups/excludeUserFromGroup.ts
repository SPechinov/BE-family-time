import { IExcludeUserFromGroupUseCase } from '@/domains/useCases';
import { GroupsUsersDeleteOneEntity } from '@/entities';
import { ErrorUserIsGroupOwner } from '@/pkg';
import { GroupsGuards } from './shared/guards';
import { GroupsUseCasesDeps } from './shared/types';

export class ExcludeUserFromGroupUseCase implements IExcludeUserFromGroupUseCase {
  readonly #deps: Pick<GroupsUseCasesDeps, 'usersService' | 'groupsUsersService'>;
  readonly #guards: GroupsGuards;

  constructor(props: Pick<GroupsUseCasesDeps, 'usersService' | 'groupsUsersService'>) {
    this.#deps = props;
    this.#guards = new GroupsGuards({ groupsUsersService: props.groupsUsersService });
  }

  async excludeUserFromGroup(props: Parameters<IExcludeUserFromGroupUseCase['excludeUserFromGroup']>[0]): Promise<void> {
    await Promise.all([
      this.#deps.usersService.findOneByUserIdOrThrow(props.actorUserId, { logger: props.logger }),
      this.#deps.usersService.findOneByUserIdOrThrow(props.targetUserId, { logger: props.logger }),
    ]);

    await this.#guards.checkIsGroupOwnerOrThrow(props.groupId, props.actorUserId, { logger: props.logger });

    if (props.actorUserId === props.targetUserId) {
      throw new ErrorUserIsGroupOwner();
    }

    await this.#guards.checkUserInGroupOrThrow(props.groupId, props.targetUserId, { logger: props.logger });

    await this.#deps.groupsUsersService.deleteOne(
      new GroupsUsersDeleteOneEntity({ userId: props.targetUserId, groupId: props.groupId }),
      { logger: props.logger },
    );
  }
}
