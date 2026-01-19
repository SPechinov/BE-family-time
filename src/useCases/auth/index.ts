import { IAuthUseCases } from '@/domains/useCases';
import { UserCreatePlainEntity } from '@/entities';
import { FastifyBaseLogger } from 'fastify';

export class AuthUseCases implements IAuthUseCases {
  async registrationStart(props: {
    userCreatePlainEntity: UserCreatePlainEntity;
    logger: FastifyBaseLogger;
  }): Promise<void> {
    console.log(props.userCreatePlainEntity);
    return;
  }
}
