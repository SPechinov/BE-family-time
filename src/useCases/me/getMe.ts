import { IUsersService } from '@/domains/services';
import { IGetMeUseCase } from '@/domains/useCases';
import { UserFindOnePlainEntity, UserPlainEntity } from '@/entities';
import { ErrorUserNotExists } from '@/pkg';

export class GetMeUseCase implements IGetMeUseCase {
  readonly #usersService: IUsersService;

  constructor(props: { usersService: IUsersService }) {
    this.#usersService = props.usersService;
  }

  async execute(props: Parameters<IGetMeUseCase['execute']>[0]): Promise<UserPlainEntity> {
    const user = await this.#usersService.findOne(new UserFindOnePlainEntity({ id: props.userId }), {
      logger: props.logger,
    });
    if (!user) throw new ErrorUserNotExists();

    return this.#usersService.decryptUser(user);
  }
}
