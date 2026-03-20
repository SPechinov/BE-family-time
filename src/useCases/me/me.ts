import { DefaultProps, IMeUseCases } from '@/domains/useCases';
import { UserPlainEntity, UserFindOnePlainEntity, UserId, UserPatchOnePlainEntity } from '@/entities';
import { IUsersService } from '@/domains/services';
import { ErrorUserNotExists } from '@/pkg';

export class MeUseCases implements IMeUseCases {
  #usersService: IUsersService;

  constructor(props: { usersService: IUsersService }) {
    this.#usersService = props.usersService;
  }

  async getMe(props: DefaultProps<{ userId: UserId }>): Promise<UserPlainEntity> {
    const user = await this.#usersService.findOne(new UserFindOnePlainEntity({ id: props.userId }), {
      logger: props.logger,
    });
    if (!user) throw new ErrorUserNotExists();

    return this.#usersService.decryptUser(user);
  }

  async patch(
    props: DefaultProps<{ userId: UserId; userPatchOnePlainEntity: UserPatchOnePlainEntity }>,
  ): Promise<UserPlainEntity> {
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
