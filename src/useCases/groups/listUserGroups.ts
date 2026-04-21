import { IListUserGroupsUseCase } from '@/domains/useCases';
import { GroupEntity, GroupFindManyEntity } from '@/entities';
import { GroupsUseCasesDeps } from './shared/types';

export class ListUserGroupsUseCase implements IListUserGroupsUseCase {
  readonly #deps: Pick<GroupsUseCasesDeps, 'usersService' | 'groupsService' | 'groupsUsersService'>;

  constructor(props: Pick<GroupsUseCasesDeps, 'usersService' | 'groupsService' | 'groupsUsersService'>) {
    this.#deps = props;
  }

  async findUserGroupsList(props: Parameters<IListUserGroupsUseCase['findUserGroupsList']>[0]): Promise<GroupEntity[]> {
    await this.#deps.usersService.findOneByUserIdOrThrow(props.userId, { logger: props.logger });

    const groupsUsers = await this.#deps.groupsUsersService.findUserGroups(props.userId, { logger: props.logger });
    const groupsIds = groupsUsers.map((groupUser) => groupUser.groupId);

    return this.#deps.groupsService.findMany(new GroupFindManyEntity({ ids: groupsIds }), { logger: props.logger });
  }
}
