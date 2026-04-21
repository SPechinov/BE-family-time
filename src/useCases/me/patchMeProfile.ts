import { IUsersService } from '@/domains/services';
import { IPatchMeProfileUseCase } from '@/domains/useCases';
import { UserFindOnePlainEntity, UserPlainEntity } from '@/entities';
import { ErrorUserNotExists } from '@/pkg';

export class PatchMeProfileUseCase implements IPatchMeProfileUseCase {
  readonly #usersService: IUsersService;

  constructor(props: { usersService: IUsersService }) {
    this.#usersService = props.usersService;
  }

  async execute(props: Parameters<IPatchMeProfileUseCase['execute']>[0]): Promise<UserPlainEntity> {
    const user = await this.#usersService.findOne(new UserFindOnePlainEntity({ id: props.userId }), {
      logger: props.logger,
    });
    if (!user) throw new ErrorUserNotExists();

    const patchedUser = await this.#usersService.patchOne(
      {
        userFindOnePlainEntity: new UserFindOnePlainEntity({ id: props.userId }),
        userPatchOnePlainEntity: props.userPatchOnePlainEntity,
      },
      {
        logger: props.logger,
      },
    );

    return this.#usersService.decryptUser(patchedUser);
  }
}
