import { DefaultProps, IMeUseCases } from '@/domains/useCases';
import { UserPlainEntity, UserFindOnePlainEntity, UserId } from '@/entities';
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
}
