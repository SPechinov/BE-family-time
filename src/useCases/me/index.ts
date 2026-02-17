import { IMeUseCases } from '@/domains/useCases';
import { UserEntity, UserFindOnePlainEntity } from '@/entities';
import { IUsersService } from '@/domains/services';
import { ErrorUserNotExists } from '@/pkg';

export class MeUseCase implements IMeUseCases {
  #usersService: IUsersService;

  constructor(props: { usersService: IUsersService }) {
    this.#usersService = props.usersService;
  }

  async getMe(props: { userId: string }): Promise<UserEntity> {
    const user = await this.#usersService.findOne({
      userFindOnePlainEntity: new UserFindOnePlainEntity({ id: props.userId }),
    });
    if (!user) throw new ErrorUserNotExists();

    return this.#usersService.decryptUser(user);
  }
}
