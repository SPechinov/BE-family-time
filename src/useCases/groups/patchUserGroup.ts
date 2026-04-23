import { IPatchUserGroupUseCase } from '@/domains/useCases';
import { GroupEntity, GroupFindOneEntity } from '@/entities';
import { ErrorGroupNotExists } from '@/pkg';
import { GroupsGuards } from './shared/guards';
import { GroupUseCasesDeps } from './shared/types';

export class PatchUserGroupUseCase implements IPatchUserGroupUseCase {
  readonly #deps: Pick<GroupUseCasesDeps, 'usersService' | 'groupsService' | 'groupsUsersService'>;
  readonly #guards: GroupsGuards;

  constructor(props: Pick<GroupUseCasesDeps, 'usersService' | 'groupsService' | 'groupsUsersService'>) {
    this.#deps = props;
    this.#guards = new GroupsGuards({ groupsUsersService: props.groupsUsersService });
  }

  async patchUserGroup(props: Parameters<IPatchUserGroupUseCase['patchUserGroup']>[0]): Promise<GroupEntity> {
    await this.#deps.usersService.findOneByUserIdOrThrow(props.userId, { logger: props.logger });
    await this.#guards.checkIsGroupOwnerOrThrow(props.groupId, props.userId, { logger: props.logger });

    const group = await this.#deps.groupsService.findOne(new GroupFindOneEntity({ id: props.groupId }), {
      logger: props.logger,
    });
    if (!group) throw new ErrorGroupNotExists();

    const patchedGroup = await this.#deps.groupsService.patchOne(
      {
        groupFindOneEntity: new GroupFindOneEntity({ id: props.groupId }),
        groupPatchOneEntity: props.groupPatchOneEntity,
      },
      { logger: props.logger },
    );
    if (!patchedGroup) throw new ErrorGroupNotExists();

    return patchedGroup;
  }
}
