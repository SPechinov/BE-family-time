import { IUsersService } from '@/domains/services';
import { IAuthUseCases } from '@/domains/useCases';
import { UserCreatePlainEntity } from '@/entities';
import { FastifyBaseLogger } from 'fastify';

export class AuthUseCases implements IAuthUseCases {
  readonly #userService: IUsersService;

  constructor(props: { userService: IUsersService }) {
    this.#userService = props.userService;
  }

  async registrationStart(props: {
    userCreatePlainEntity: UserCreatePlainEntity;
    logger: FastifyBaseLogger;
  }): Promise<void> {
    console.log({ ...props.userCreatePlainEntity });
    return;
  }
}
