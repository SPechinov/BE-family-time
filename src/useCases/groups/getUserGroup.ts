import { IGetUserGroupUseCase } from '@/domains/useCases';
import { GroupEntity, GroupFindOneEntity, GroupsUsersFindOneEntity } from '@/entities';
import { ErrorGroupNotExists } from '@/pkg';
import { GroupUseCasesDeps } from './shared/types';

export class GetUserGroupUseCase implements IGetUserGroupUseCase {
  readonly #deps: Pick<GroupUseCasesDeps, 'usersService' | 'groupsUsersService' | 'groupsService'>;

  constructor(props: Pick<GroupUseCasesDeps, 'usersService' | 'groupsUsersService' | 'groupsService'>) {
    this.#deps = props;
  }

  async execute(props: Parameters<IGetUserGroupUseCase['execute']>[0]): Promise<GroupEntity> {
    await this.#deps.usersService.findOneByUserIdOrThrow(props.userId, { logger: props.logger });

    const groupUser = await this.#deps.groupsUsersService.findOne(
      new GroupsUsersFindOneEntity({ groupId: props.groupId, userId: props.userId }),
      { logger: props.logger },
    );
    if (!groupUser) throw new ErrorGroupNotExists();

    const group = await this.#deps.groupsService.findOne(new GroupFindOneEntity({ id: props.groupId }), {
      logger: props.logger,
    });
    if (!group) throw new ErrorGroupNotExists();

    return group;
  }
}
